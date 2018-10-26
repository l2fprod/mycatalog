
function ServiceUpdater() {
  const apiUrl = 'https://resource-catalog.bluemix.net/api/v1';

  const request = require('request');
  const fs = require('fs');
  const async = require('async');
  const vm = require('vm');

  const script = vm.createScript(fs.readFileSync('./public/js/cloud-configuration.js'));
  const sandbox = {};
  script.runInNewContext(sandbox);

  const categories = sandbox.categories.map(function (category) {
    return category.id;
  });
  const regions = sandbox.regions;

  const self = this;

  try {
    fs.mkdirSync('public/generated');
  } catch (err) {
  }
  try {
    fs.mkdirSync('public/generated/icons');
  } catch (err) {
  }

  function getResources(url, resources, onResult) {
    console.log('Retrieving', url);
    request({
      url,
      json: true
    }, (err, response, body) => {
      if (err) {
        onResult(err);
        return;
      }

      console.log(`Found ${body.resources.length} additional resources`);
      const allResources = resources.concat(body.resources);
      if (body.next) {
        getResources(body.next, allResources, onResult);
      } else {
        onResult(null, allResources);
      }
    });
  }

  // find children of resource groups
  function getChildren(resources, callback) {
    const tasks = [];
    resources.filter(resource => resource.group === true).forEach((resource) => {
      tasks.push((taskCallback) => {
        console.log('Get children for', resource.name, `${apiUrl}/${resource.id}?complete=true&depth=*`);
        request({
          url: `${apiUrl}/${resource.id}?complete=true&depth=*`,
          json: true
        }, (err, response, body) => {
          if (err) {
            console.log('[KO] Failed to get full details for', resource.name);
          } else if (body.children) {
            body.children
              .filter(child => child.kind === 'iaas' || child.kind === 'service')
              .forEach((child) => {
                console.log('Found', child.id);
                resources.push(child);
              });
          }
          taskCallback(null);
        });
      });
    });

    async.parallel(tasks, function (err, result) {
      console.log("Retrieved all children");
      if (err) {
        console.log(err);
      }
      callback(null);
    });
  }

  function getPlans(resources, callback) {
    const tasks = [];
    resources.forEach((resource) => {
      tasks.push((callback) => {
        console.log('Get plans for', resource.name, `${apiUrl}/${resource.id}/plan?complete=true`);
        request({
          url: `${apiUrl}/${resource.id}/plan?complete=true`,
          json: true
        }, (err, response, body) => {
          if (err) {
            console.log('[KO] Failed to get plan for', resource.name);
          } else {
            if (body.next) {
              console.log('Found a resource with a lot of plans!!!');
            }
            resource.plans = body.resources;
            resource.plans.forEach((plan) => {
              plan.description = plan.overview_ui['en'].description;
              plan.displayName = plan.overview_ui['en'].display_name;
              if (plan.metadata.plan && plan.metadata.plan.extra) {
                plan.metadata.plan.extra = JSON.parse(plan.metadata.plan.extra);
              } else {
                console.log(`Plan ${plan.name} in ${resource.name} has no 'plan' metadata`);
              }
              plan.originalName = plan.metadata.original_name;
            });
          }
          callback(null);
        });
      });
    });

    async.parallel(tasks, function (err, result) {
      console.log("Retrieved all plans");
      if (err) {
        console.log(err);
      }
      callback(null);
    });
  }

  function getImages(resources, callback) {
    var tasks = []
    resources.forEach(function (resource) {
      tasks.push(function (callback) {
        const imageUrl = decodeURIComponent(resource.imageUrl);
        if (!imageUrl) {
          console.log(resource.id, 'has no image!');
        }
        request({
          url: imageUrl,
          encoding: null
        }, function (err, res, body) {
          if (err) {
            callback(null);
          } else {
            var extension;
            if (imageUrl.indexOf(".svg") > 0) {
              extension = "svg";
            } else {
              extension = "png";
            }
            fs.writeFile("public/generated/icons/" + resource.id + "." + extension, body, function (err) {
              if (err) {
                callback(null);
              } else {
                if (extension === "svg") {
                  var svg2png = require("svg2png");  
                  var imageBuffer = fs.readFileSync("public/generated/icons/" + resource.id + ".svg");
                  svg2png(imageBuffer, { width: 64, height: 64 })
                    .then(buffer => fs.writeFile("public/generated/icons/" + resource.id + ".png", buffer, (convertError) => {
                      if (convertError) {
                        console.log(convertError);
                      }
                      callback(null);
                    }))
                    .catch(e => {
                      console.log('Error generating icon for', resource.imageUrl, e);
                      callback(null);
                    });
                } else {
                  callback(null);
                }
              }
            });
          }
        });
      });
    });

    async.parallel(tasks, function (err, result) {
      console.log('Retrieved all icons');
      if (err) {
        console.log(err);
      }
      callback(null);
    });
  }

  function removeAllBut(object, keysToKeep) {
    Object.keys(object).forEach((key) => {
      if (keysToKeep.indexOf(key) < 0) {
        delete object[key];
      }
    });
  }

  self.run = function(serviceUpdaterCallback) {
    const tasks = [];
    let resources;

    // retrieve all resources
    tasks.push((callback) => {
      getResources(`${apiUrl}?complete=true&q=kind:iaas kind:service`, [],
        (err, result) => {
          if (err) {
            console.log('[KO]', err);
            callback(err);
          } else {
            console.log('[OK]', result.length, 'resources');
            resources = result;
            callback(null);
          }
        });
      });

    // retrieve all children
    tasks.push((callback) => {
      getChildren(resources, callback);
    });

    // keep "iaas" and "service"
    tasks.push((callback) => {
      resources = resources.filter(resource =>
        (resource.kind === 'iaas' || resource.kind === 'service') &&
        (!resource.group || resource.parent_url));
      callback(null);
    });

    // retrieve the plans
    tasks.push((callback) => {
      getPlans(resources, callback);
    });

    // sanitize the output
    tasks.push((callback) => {
      resources.forEach((resource) => {
        // resolve the "extra" tag
        try {
          if (resource.metadata.service.extra) {
            resource.metadata.service.extra = JSON.parse(resource.metadata.service.extra);
          }
        } catch (err) {}
        resource.description = resource.overview_ui['en'].description;
        resource.longDescription = resource.overview_ui['en'].long_description;
        try {
          resource.displayName = resource.overview_ui['en'].display_name || resource.metadata.service.extra.displayName;
        } catch (err) {
          console.log('No display name found for', resource.id, resource.name);
          resource.displayName = resource.name;
        }
        if (resource.displayName.startsWith('IBM ')) {
          resource.displayName = resource.displayName.substring(4);
        }
        resource.imageUrl = resource.images.image || resource.images.feature_image;

        // inject custom tags
        resource.tags = resource.tags.concat(resource.pricing_tags || []).concat(resource.geo_tags || []);
        resource.tags.push(`custom_kind_${resource.kind}`);

        const tagsAsString = resource.tags.join(',');
        regions.forEach((region) => {
          // some services have "us-south-dal10" in their geo_tags
          // we add the main region "us-south" tag too
          if (tagsAsString.indexOf(`${region.tag}-`)>=0 && resource.tags.indexOf(region.tag)<0) {
            resource.tags.push(region.tag);
          }

          // for services, find their region with the CF mapping
          try {
            if (resource.metadata.service.cf_guid[region.tag]) {
              resource.tags.push(region.tag);
            }
          } catch (_) {}
        });

        // not all ibm services have the ibm_created tag, fix this!
        if (resource.provider.name === 'IBM' &&
            resource.tags.indexOf("ibm_created") < 0 &&
            resource.tags.indexOf("ibm_third_party") < 0) {
          if (resource.tags.find(tag => tag.indexOf('ibm_')===0)) {
            resource.tags.push('ibm_created');
          }
        }

        // more tags
        try {
          if (resource.metadata.service.iam_compatible) {
            resource.tags.push('iam_compatible');
          }
        } catch (_) {}

        try {
          if (resource.metadata.rc_compatible) {
            resource.tags.push('rc_compatible');
          }
        } catch (_) {}

        // sort tags (categories first)
        resource.tags.sort(function (tag1, tag2) {
          var isCategory1 = categories.indexOf(tag1) >= 0
          var isCategory2 = categories.indexOf(tag2) >= 0

          if (isCategory1 && !isCategory2) {
            return -1;
          }

          if (!isCategory1 && isCategory2) {
            return 1;
          }

          return tag1.localeCompare(tag2);
        });
      });

      // sort on display name
      resources.sort((resource1, resource2) => {
        return resource1.displayName.localeCompare(resource2.displayName);
      });

      callback(null);
    });


    // save the full version
    tasks.push((callback) => {
      console.log('Writing full resource file...');
      const stream = fs.createWriteStream("public/generated/resources-full.json");
      stream.once('open', function (fd) {
        stream.write(JSON.stringify(resources, null, 2));
        stream.end();
      });
      stream.once('finish', () => { callback(null); });
    });

    // save a light version too for the web UI and the database (something smaller than 1MB!)
    tasks.push((callback) => {
      console.log('Writing light resource file...');
      resources.forEach((resource) => {
        removeAllBut(resource, [
          'geo_tags',
          'id',
          'kind',
          'metadata',
          'name',
          'tags',
          'plans',
          'pricing_tags',
          'description',
          'longDescription',
          'displayName',
          'imageUrl'
        ]);

        if (resource.metadata) {
          removeAllBut(resource.metadata, [
            'service'
          ]);
        }

        if (resource.metadata && resource.metadata.service) {
          removeAllBut(resource.metadata.service, [
            'cf_service_name',
          ]);
        }

        resource.plans.forEach((plan) => {
          removeAllBut(plan, [
            'id',
            'name',
            'description',
            'displayName',
            'originalName',
          ]);
        });

      });
      const stream = fs.createWriteStream("public/generated/resources.json");
      stream.once('open', function (fd) {
        stream.write(JSON.stringify(resources, null, 2));
        stream.end();
      });
      stream.once('finish', () => { callback(null); });
    });

    tasks.push((callback) => {
      getImages(resources, callback);
    });

    async.waterfall(tasks, (err) => {
      if (err) {
        console.log('[KO]', err);
      } else {
        console.log('[OK] Processing complete!');
      }
      if (serviceUpdaterCallback) {
        serviceUpdaterCallback(err, resources);
      }
    });
  }
}

module.exports = function () {
  return new ServiceUpdater();
}
