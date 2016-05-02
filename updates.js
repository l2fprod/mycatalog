var express = require('express');
var router = express.Router();
var fs = require("fs");
var RSS = require('rss');

// Added to loop through the region
var vm = require('vm');
var script = vm.createScript(fs.readFileSync('./public/js/bluemix-configuration.js'));
var sandbox = {};
script.runInNewContext(sandbox);
var regions = sandbox.regions;
var categories = sandbox.categories;

var database;

router.get('/all', function (req, res) {
  database.view("snapshots", "by_date", {
    descending: true,
    limit: 5,
    include_docs: true
  }, function (err, body) {
    if (err) {
      res.status(500).send();
    } else {
      processSnapshots(body.rows.map(function(row) { return row.doc; }), res);
    }
  });
});

function processSnapshots(snapshots, res) {
  // snapshots are sorted from most recent to oldest
  //var snapshots = JSON.parse(fs.readFileSync('updates.json', 'utf8'));

  var changes = [];
  var current = 0
  while (current < snapshots.length - 1) {
    changes.push(getDifferences(snapshots[current], snapshots[current + 1]));
    current = current + 1;
  }

  var feed = new RSS({
    title: "mycatalog updates",
    generator: "mycatalog",
    site_url: "http://mycatalog.mybluemix.net",
    description: "'My Catalog' uses the Cloudfoundry API to retrieve data from the Bluemix catalog. It tries to be as accurate as possible. This feed shows additions, updates, removals from the catalog. Use with care. It is a work-in-progress :)"
  });
  changes.forEach(function (change) {
    change.added.forEach(function (service) {
      feed.item({
        title: "[added] " + service.entity.extra.displayName + " (" + service.entity.label + ")",
        description: service.entity.description,
        url: "http://mycatalog.mybluemix.net/?date=" + encodeURIComponent(change.date) +
          "&service=" + encodeURIComponent(service.entity.label) +
          "&type=added",
        date: change.date
      })
    });
    change.removed.forEach(function (service) {
      feed.item({
        title: "[removed] " + service.entity.extra.displayName + " (" + service.entity.label + ")",
        url: "http://mycatalog.mybluemix.net/?date=" + encodeURIComponent(change.date) +
          "&service=" + encodeURIComponent(service.entity.label) +
          "&type=removed",
        date: change.date
      })
    });
    change.updates.forEach(function (update) {
      feed.item({
        title: "[updated] " + update,
        url: "http://mycatalog.mybluemix.net/?date=" + encodeURIComponent(change.date) +
          "&service=" + encodeURIComponent(update) +
          "&type=updated",
        date: change.date
      })
    });
  });

  res.header("Content-Type", "application/rss+xml");
  res.send(feed.xml({
    indent: true
  }));
}

function getDifferences(newSnapshot, oldSnapshot) {
  var newServices = newSnapshot.services;
  var oldServices = oldSnapshot.services;
  var changes = {
    date: newSnapshot.createdAt,
    added: [],
    removed: [],
    updates: []
  };

  var labelToNewService = []
  newServices.forEach(function (service) {
    labelToNewService[service.entity.label] = service;
  });

  var labelToOldService = []
  oldServices.forEach(function (service) {
    labelToOldService[service.entity.label] = service;
  });

  // any new services?
  Object.keys(labelToNewService).forEach(function (serviceLabel) {
    if (!labelToOldService.hasOwnProperty(serviceLabel)) {
      changes.added.push(labelToNewService[serviceLabel]);
    }
  });

  // any service removed?
  Object.keys(labelToOldService).forEach(function (serviceLabel) {
    if (!labelToNewService.hasOwnProperty(serviceLabel)) {
      changes.removed.push(labelToOldService[serviceLabel]);
    }
  });


  Object.keys(labelToNewService).forEach(function (serviceLabel) {
    var newService = labelToNewService[serviceLabel];
    var oldService = labelToOldService[serviceLabel];
    if (!oldService) {
      return;
    }

    // any change in the datacenters?
    regions.forEach(function (region) {
      var newIsInRegion = newService.entity.tags.indexOf(region.tag) >= 0;
      var oldIsInRegion = oldService.entity.tags.indexOf(region.tag) >= 0;

      if (newIsInRegion && !oldIsInRegion) {
        changes.updates.push(newService.entity.label + " was added in " + region.label);
      }

      if (!newIsInRegion && oldIsInRegion) {
        changes.updates.push(newService.entity.label + " was removed from " + region.label);
      }
    });


    // any change in their lifecycle? experimental -> beta -> release
  });



  return changes;
}

module.exports = function (Database) {
  database = Database;
  return router;
}
