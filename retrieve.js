function ServiceUpdater() {
  var self = this;

  var Client = require('cloudfoundry-client');
  var fs = require('fs');
  var async = require('async');
  var request = require('request');
  var vm = require('vm');

  var script = vm.createScript(fs.readFileSync('./public/js/bluemix-configuration.js'));
  var sandbox = {};
  script.runInNewContext(sandbox);

  var categories = sandbox.categories.map(function (category) {
    return category.id;
  });
  var regions = sandbox.regions;

  try {
    fs.mkdirSync('public/generated');
  } catch (err) {
    console.log(err);
  }
  try {
    fs.mkdirSync('public/generated/icons');
  } catch (err) {
    console.log(err);
  }

  self.run = function (serviceUpdaterCallback) {
    var tasks = [];
    var services = [];

    // retrieve services from all regions
    regions.forEach(function (region) {
      tasks.push(function (callback) {
        getServices(region.api, region.serviceFilename, callback);
      });
    });

    // retrieve plans from all regions
    regions.forEach(function (region) {
      tasks.push(function (callback) {
        getPlans(region.api, region.planFilename, callback);
      });
    });

    // load the reference file and mark its services as present in the DC
    tasks.push(function (callback) {
      services = JSON.parse(fs.readFileSync(regions[0].serviceFilename));
      services.forEach(function (service) {
        service.entity.tags.push(regions[0].tag);
      });
      callback(null);
    });

    // merge all regions and add tags
    regions.slice(1).forEach(function (otherRegion) {
      tasks.push(function (callback) {
        console.log("Marking services in", otherRegion.label);
        var otherServices = JSON.parse(fs.readFileSync(otherRegion.serviceFilename));

        var uidToServices = {};
        otherServices.forEach(function (service) {
          uidToServices[service.entity.label] = service;
        });

        // mark the services
        services.forEach(function (service) {
          if (uidToServices[service.entity.label]) {
            service.entity.tags.push(otherRegion.tag);
            delete uidToServices[service.entity.label];
          }
        });

        Object.keys(uidToServices).forEach(function (key) {
          console.log(uidToServices[key].entity.label, "is only available in", otherRegion.id, ". Adding it to main region");
          uidToServices[key].entity.tags.push(otherRegion.tag);
          services.push(uidToServices[key]);
        });

        callback(null);
      });
    });

    // add the plans to the services
    tasks.push(function (callback) {
      console.log("Injecting plans in services...");
      var guidToServices = [];
      services.forEach(function (service) {
        // keep track of services to match their plans
        guidToServices[service.metadata.guid] = service;
        // prepare the plans array
        service.plans = [];
      });

      regions.forEach(function (region) {
        var plans = JSON.parse(fs.readFileSync(region.planFilename));
        plans.forEach(function (plan) {
          if (guidToServices.hasOwnProperty(plan.entity.service_guid)) {
            guidToServices[plan.entity.service_guid].plans.push(plan);
            // inject our custom "free" tag if the service has a free plan
            if (plan.entity.free == true) {
              guidToServices[plan.entity.service_guid].entity.tags.push("custom_has_free_plan");
            }
          }
        });
      });

      callback(null);
    });

    // we got all services now
    tasks.push(function (callback) {
      console.log("Post-processing services...");
      services.forEach(function (service) {
        // sort tags (categories first)
        service.entity.tags.sort(function (tag1, tag2) {
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

        // not all ibm services have the ibm_created tag, fix this!
        if (service.entity.provider != "core" &&
          service.entity.tags.indexOf("ibm_created") < 0 &&
          service.entity.tags.indexOf("ibm_third_party") < 0) {
          var isIbmService;
          service.entity.tags.forEach(function (tag) {
            if (tag.indexOf("ibm_") == 0) {
              isIbmService = true;
            }
          });
          if (isIbmService) {
            service.entity.tags.push("ibm_created");
          }
        }
      });

      // sort on name
      services.sort(function (s1, s2) {
        var s1Name = s1.entity.label;
        if (s1.entity.extra) {
          s1Name = s1.entity.extra.displayName || s1.entity.label;
        }
        var s2Name = s2.entity.label;
        if (s2.entity.extra) {
          s2Name = s2.entity.extra.displayName || s2.entity.label;
        }
        return s1Name.toLocaleLowerCase().localeCompare(s2Name.toLocaleLowerCase());
      });

      callback(null);
    });

    // write the service full file
    tasks.push(function(callback) {
      console.log("Writing full service file...");
      var stream = fs.createWriteStream("public/generated/services-full.json");
      stream.once('open', function (fd) {
        stream.write(JSON.stringify(services, null, 2));
        stream.end();
      });
      stream.once('finish', () => { callback(null); });
    });

    // write the light version for the webpage
    // and for the database. we need a small file to fit within the 1M limit of cloudant post
    tasks.push(function(callback) {
      console.log("Writing light service file...");
      services.forEach(function(service) {
        // diet - remove things we don't need today, it makes the JSON smaller
        if (service.entity.extra) {
          delete service.entity.extra.media;
          delete service.entity.extra.bullets;
          delete service.entity.extra.i18n;
        }
        service.plans.forEach(function (plan) {
          if (plan.entity.extra) delete plan.entity.extra.costs;
        });

        removeUndefined(service);
      });

      var stream = fs.createWriteStream("public/generated/services.json");
      stream.once('open', function (fd) {
        stream.write(JSON.stringify(services, null, 2));
        stream.end();
      });
      stream.once('finish', () => { callback(null); });
    });

    // get the service icons
    tasks.push(function(callback) {
      getImages(services);
      callback(null);
    });

    async.waterfall(tasks, function (err, result) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Got", services.length, "from all regions");
        console.log("Retrieved all data");
      }

      if (serviceUpdaterCallback) {
        serviceUpdaterCallback(err, services);
      }
    });
  }

  // delete nulls or empty or attribute we don't need
  function removeUndefined(anObject) {
    Object.keys(anObject).forEach((key) => {
      if (key === 'service_instances_url' ||
          key === 'service_url' ||
          key === 'service_plans_url' ||
          key === 'service_broker_guid') {
        delete anObject[key];
      } else if (!anObject[key]) {
        delete anObject[key];
      } else if (Array.isArray(anObject[key])) {
        if (anObject[key].length === 0) {
          delete anObject[key];
        } else {
          anObject[key].forEach(item => removeUndefined(item));
        }
      } else if (typeof anObject[key] === 'object') {
        if (Object.keys(anObject[key]).length === 0) {
          delete anObject[key];
        } else {
          removeUndefined(anObject[key]);
        }
      }
    });
  }

  function getImages(services) {
    var tasks = []
    services.forEach(function (service) {
      tasks.push(function (callback) {
        var extra = service.entity.extra;
        if (extra && extra.imageUrl) {
          request({
            url: extra.imageUrl,
            encoding: null
          }, function (err, res, body) {
            if (err) {
              callback(err);
            } else {
              var extension;
              if (extra.imageUrl.indexOf(".svg") > 0) {
                extension = "svg";
              } else {
                extension = "png";
              }
              fs.writeFile("public/generated/icons/" + service.metadata.guid + "." + extension, body, function (err) {
                if (err) {
                  callback(err);
                } else {
                  if (extension === "svg") {
                    var svgToPng = require("svg-to-png");
                    svgToPng.convert("public/generated/icons/" + service.metadata.guid + ".svg",
                      "public/generated/icons/", {
                        defaultWidth: "64px",
                        defaultHeight: "64px"
                    }).then(function () {
                      callback(null);
                    }, function(err) {
                      console.log("Convert failed for",
                        "public/generated/icons/" + service.metadata.guid + ".svg", "with", err);
                      callback(null);
                    });
                  } else {
                    callback(null);
                  }
                }
              });
            }
          });
        }
      });
    });

    async.parallel(tasks, function (err, result) {
      console.log("Retrieved all icons");
      if (err) {
        console.log(err);
      }
    });
  }

  function getServices(api, outputFilename, callback) {
    console.log("Retrieving services for", api);
    var anonymousClient = new Client({
      host: api,
      protocol: 'https:',
      token: "" // no token, we get only what's public
    });
    anonymousClient.services.get(function (err, services) {
      if (err) {
        callback(err);
      } else {
        console.log("Found", services.length, "services");

        services.forEach(function (service) {
          // resolve the embedded JSON value
          if (service.entity.extra) {
            service.entity.extra = JSON.parse(service.entity.extra);
          }
        });
        var stream = fs.createWriteStream(outputFilename);
        stream.once('open', function (fd) {
          stream.write(JSON.stringify(services, null, 2));
          stream.end();
        });
        stream.once('finish', () => { callback(null); });
      }
    });
  };

  function getPlans(api, outputFilename, callback) {
    console.log("Retrieving plans for", api);
    var anonymousClient = new Client({
      host: api,
      protocol: 'https:',
      token: "" // no token, we get only what's public
    });
    anonymousClient.servicePlans.get(function (err, servicePlans) {
      if (err) {
        callback(err);
      } else {
        console.log("Found", servicePlans.length, "service plans");
        servicePlans.forEach(function (plan) {
          if (plan.entity.extra) {
            plan.entity.extra = JSON.parse(plan.entity.extra);
          }
        });
        var stream = fs.createWriteStream(outputFilename);
        stream.once('open', function (fd) {
          stream.write(JSON.stringify(servicePlans, null, 2));
          stream.end();
        });
        stream.once('finish', () => { callback(null); });
      }
    });
  }
}

module.exports = function () {
  return new ServiceUpdater();
}
