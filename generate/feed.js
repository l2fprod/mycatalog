var express = require('express');
var router = express.Router();
var fs = require("fs");
var RSS = require('rss');

// Added to loop through the region
var vm = require('vm');
var script = vm.createScript(fs.readFileSync('../docs/js/cloud-configuration.js'));
var sandbox = {};
script.runInNewContext(sandbox);
var regions = sandbox.regions;

function generateFeed(snapshots) {
  // snapshots are sorted from most recent to oldest
  var allDifferences = [];
  var current = 0
  while (current < snapshots.length - 1) {
    allDifferences.push(getDifferences(snapshots[current], snapshots[current + 1]));
    current = current + 1;
  }

  var siteUrl = process.env.SITE_URL || "https://mycatalog.weworkinthecloud.com";

  var feed = new RSS({
    title: "mycatalog updates",
    generator: "mycatalog",
    site_url: siteUrl,
    description: "'My Catalog' uses the IBM Cloud catalog API to retrieve data from the catalog. It attempts to be as accurate as possible. This feed shows additions, updates, removals from the catalog. Use with care. It is a work-in-progress :)"
  });

  allDifferences.forEach(function (result) {
    result.changes.forEach(function (change) {

      var title = "[" + change.tag + "] " + change.service.displayName + " (" + change.service.name + ")";
      title = title + (change.title ? (" " + change.title) : "");

      feed.item({
        title: title,
        description: change.description,
        url: siteUrl + "/?date=" + encodeURIComponent(result.date) +
          "&service=" + encodeURIComponent(change.service.name) +
          "&type=" + change.tag,
        date: result.date
      })
    });
  });

  return feed.xml({
    indent: true
  });
}

function getDifferences(newSnapshot, oldSnapshot) {
  var newServices = newSnapshot.resources;
  var oldServices = oldSnapshot.resources;
  var result = {
    date: newSnapshot.createdAt,
    changes: []
  };
  if (!newServices || !oldServices) {
    return result;
  }

  function captureStatusChange(newService, oldService, tag) {
    var newHasTag = newService.tags.indexOf(tag) >= 0;
    var oldHasTag = oldService.tags.indexOf(tag) >= 0;
    // no change
    if (newHasTag == oldHasTag) {
      return;
    }

    if (newHasTag) {
      result.changes.push({
        tag: "updated",
        service: newService,
        title: "was marked with " + tag
      });
    } else {
      result.changes.push({
        tag: "updated",
        service: newService,
        title: "is no longer marked with " + tag
      });
    }
  }

  var labelToNewService = []
  newServices.forEach(function (service) {
    labelToNewService[service.id] = service;
  });

  var labelToOldService = []
  oldServices.forEach(function (service) {
    labelToOldService[service.id] = service;
  });

  // any new services?
  Object.keys(labelToNewService).forEach(function (serviceLabel) {
    if (!labelToOldService.hasOwnProperty(serviceLabel)) {
      result.changes.push({
        tag: "added",
        service: labelToNewService[serviceLabel],
        description: labelToNewService[serviceLabel].description
      });
    }
  });

  // any service removed?
  Object.keys(labelToOldService).forEach(function (serviceLabel) {
    if (!labelToNewService.hasOwnProperty(serviceLabel)) {
      result.changes.push({
        tag: "removed",
        service: labelToOldService[serviceLabel],
        description: labelToOldService[serviceLabel].description
      });
    }
  });

  // any differences between old and new versions of a service
  Object.keys(labelToNewService).forEach(function (serviceLabel) {
    var newService = labelToNewService[serviceLabel];
    var oldService = labelToOldService[serviceLabel];
    if (!oldService) {
      return;
    }

    // any name change?
    var newName = newService.displayName;
    var oldName = oldService.displayName;
    if (newName != oldName) {
      result.changes.push({
        tag: "updated",
        service: newService,
        title: "is the new name of " + oldName
      });
    }

    // any change in the datacenters?
    regions.forEach(function (region) {
      var newIsInRegion = (newService.geo_tags || []).indexOf(region.tag) >= 0;
      var oldIsInRegion = (oldService.geo_tags || []).indexOf(region.tag) >= 0;

      if (newIsInRegion && !oldIsInRegion) {
        result.changes.push({
          tag: "updated",
          service: newService,
          title: "was made available in the " + region.label + " catalog"
        });
      }

      if (!newIsInRegion && oldIsInRegion) {
        result.changes.push({
          tag: "updated",
          service: newService,
          title: "was removed from the " + region.label + " catalog"
        });
      }
    });

    // any deprecation notice
    var newIsDeprecated = newService.tags.indexOf("ibm_deprecated") >= 0;
    var oldIsDeprecated = oldService.tags.indexOf("ibm_deprecated") >= 0;

    if (newIsDeprecated && !oldIsDeprecated) {
      result.changes.push({
        tag: "deprecated",
        service: newService
      });
    }

    captureStatusChange(newService, oldService, "fs_ready");
    captureStatusChange(newService, oldService, "hipaa");

    // look at plans
    var newServicePlans = [];
    newService.plans.forEach(function (plan) {
      newServicePlans[plan.name] = plan;
    });

    var oldServicePlans = [];
    oldService.plans.forEach(function (plan) {
      oldServicePlans[plan.name] = plan;
    });

    // any new plans?
    Object.keys(newServicePlans).forEach(function (planName) {
      const newPlan = newServicePlans[planName];
      if (!oldServicePlans.hasOwnProperty(planName)) {
        result.changes.push({
          tag: "updated",
          service: newService,
          title: "has a new plan named " + planName,
          description: newPlan.description
        });
      } else {
        // the plan was there, any change?
        const oldPlan = oldServicePlans[planName];
        if (oldPlan.description !== newPlan.description) {
          result.changes.push({
            tag: "updated",
            service: newService,
            title: "has changed the description of the plan named " + planName,
            description: `*before*: ${oldPlan.description}, *after*: ${newPlan.description}`
          });
        }
      }
    });

    // any removed plans?
    Object.keys(oldServicePlans).forEach(function (planName) {
      if (!newServicePlans.hasOwnProperty(planName)) {
        result.changes.push({
          tag: "updated",
          service: newService,
          title: "has removed the plan named " + planName
        });
      }
    });

    // any change in their lifecycle? experimental -> beta -> release
    function serviceLifecycle(service) {
      var status = "Production Ready";
      if (service.tags.indexOf('ibm_beta') >= 0) {
        status = "Beta";
      } else if (service.tags.indexOf('ibm_experimental') >= 0) {
        status = "Experimental";
      }
      return status;
    }

    var newServiceStatus = serviceLifecycle(newService);
    var oldServiceStatus = serviceLifecycle(oldService);

    // only report lifecycle changes if the service is not deprecated
    if (!newIsDeprecated && newServiceStatus != oldServiceStatus) {
      result.changes.push({
        tag: "lifecycle",
        service: newService,
        title: "moved from " + oldServiceStatus + " to " + newServiceStatus
      });
    }

  });

  return result;
}

module.exports = {
  generateFeed
}