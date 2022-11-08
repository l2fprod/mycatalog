
function ServiceUpdater() {
  const apiUrl = 'https://globalcatalog.cloud.ibm.com/api/v1';

  const request = require('request');
  const fs = require('fs');
  const async = require('async');
  const Jimp = require('jimp');
  const zlib = require('zlib');

  const catalogCategories = JSON.parse(fs.readFileSync('../docs/js/categories.json', 'utf-8'));
  const categories = catalogCategories.map(function (category) {
    return category.id;
  });

  const self = this;

  try {
    fs.mkdirSync('../docs/generated');
  } catch (err) {
  }
  try {
    fs.mkdirSync('../docs/generated/icons');
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
      const allResources = resources.concat(body.resources.filter(resource => resource.active));
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
            resource.plans = body.resources.filter(plan => plan.active);
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
    console.log('Retrieving icons...');
    resources.forEach(function (resource) {
      tasks.push(function (callback) {
        console.log(`[${resource.name}] getting icon`);
        const imageUrl = decodeURIComponent(resource.imageUrl);
        if (!imageUrl) {
          console.log(`[${resource.name}] ${resource.id} has no image!`);
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
            fs.writeFile("../docs/generated/icons/" + resource.id + "." + extension, body, function (err) {
              if (err) {
                console.log(`[${resource.name}] could not write icon`);
                callback(null);
              } else {
                console.log(`[${resource.name}] wrote ${extension}`);
                if (extension === "svg") {
                  resource.localSvgIcon = "/generated/icons/" + resource.id + "." + extension;
                  var imageBuffer = fs.readFileSync("../docs/generated/icons/" + resource.id + ".svg");
                  // some svg are compressed
                  try {
                    imageBuffer = zlib.gunzipSync(imageBuffer);
                  } catch (e) {
                    // console.log(`Could not unzip buffer for ${resource.name}`);
                  }
                  var sharp = require('sharp');
                  sharp(imageBuffer)
                    .resize(64, 64)
                    .png()
                    .toBuffer()
                    .then(buffer => fs.writeFile("../docs/generated/icons/" + resource.id + ".png", buffer, (convertError) => {
                      console.log(`[${resource.name}] wrote png`);
                      resource.localPngIcon = "/generated/icons/" + resource.id + ".png";
                      if (convertError) {
                        console.log(`[${resource.name}] could not read, using default`);
                        fs.copyFileSync("../docs/icons/default-service.png", "../docs/generated/icons/" + resource.id + ".png");
                      }
                      callback(null);
                    }))
                    .catch(e => {
                      console.log(`[${resource.name}] could not read icon, using default`);
                      fs.copyFileSync("../docs/icons/default-service.png", "../docs/generated/icons/" + resource.id + ".png");
                      callback(null);
                    });
                } else {
                  resource.localPngIcon = "/generated/icons/" + resource.id + ".png";
                  Jimp.read("../docs/generated/icons/" + resource.id + ".png", (readErr, imageBuffer) => {
                    if (readErr) {
                      console.log(`[${resource.name}] could not read icon, using default`);
                      fs.copyFileSync("../docs/icons/default-service.png", "../docs/generated/icons/" + resource.id + ".png");
                      callback(null);
                    } else {
                      imageBuffer.write("../docs/generated/icons/" + resource.id + ".png", (writeErr) => {
                        if (writeErr) {
                          console.log(writeErr);
                        }
                        callback(null);
                      });
                    }
                  });
                }
              }
            });
          }
        });
      });
    });

    async.parallelLimit(tasks, 5, function (err, result) {
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

  function getGeography(geoId, callback) {
    request({
      url: `${apiUrl}/${geoId}?depth=*`,
      json: true
    }, (err, response, body) => {
      callback(err, body);
    });
  }

  function collectChildren(root, accept, result) {
    if (!root.children) {
      return result;
    }

    root.children.forEach(child => {
      if (accept(child)) {
        result.push(child);
      }
      collectChildren(child, accept, result);
    });

    return result;
  }

  self.run = function() {
    const tasks = [];
    let resources;
    let geographies = [];

    // retrieve all geos
    tasks.push((callback) => {
      // https://globalcatalog.cloud.ibm.com/api/v1?q=kind:geography
      getResources(`${apiUrl}?q=kind:geography`, [],
        (err, result) => {
          if (err) {
            console.log('[KO]', err);
            callback(err);
          } else {
            console.log('[OK]', result.length, 'geographies');
            result.forEach((geo) => {
              // don't reference the global region
              if (geo.id == "global") {
                return;
              }
              tasks.push((callback) => {
                getGeography(geo.id, (err, geo) => {
                  if (err) {
                    console.log('[KO]', err);
                    callback(err);
                  } else {
                    console.log('[OK] Got details for geo', geo.id);
                    geographies.push({
                      id: geo.id,
                      tag: geo.id,
                      label: geo.overview_ui.en.display_name,
                      overview_ui: geo.overview_ui,
                      regions: collectChildren(geo, (child) => child.kind == "region", []).map((region) => {
                        return {
                          id: region.id,
                          label: region.overview_ui.en.display_name,
                          tag: region.id,
                          overview_ui: region.overview_ui,
                        }
                      }),
                      datacenters: collectChildren(geo, (child) => child.kind == "dc", []).map((dc) => {
                        return {
                          id: dc.id,
                          label: dc.overview_ui.en.display_name,
                          tag: dc.id,
                          overview_ui: dc.overview_ui
                        }
                      }),
                    });
                    callback(null);
                  }
                });
              });
              tasks.push((callback) => {
                try {
                  fs.writeFileSync("../docs/generated/geographies.json", JSON.stringify(geographies, null, 2));
                  callback(null);
                } catch (err) {
                  callback(err);
                }
              });
            })
            callback(null);
          }
        }
      );
    });

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
    // and get rid of the services not visible in the catalog UI
    const ignoredResources = [
      // 'compose-enterprise',
      // 'compose-for-elasticsearch',
      // 'compose-for-etcd',
      // 'compose-for-mongodb',
      // 'compose-for-mysql',
      // 'compose-for-postgresql',
      // 'compose-for-rabbitmq',
      // 'compose-for-redis',
      // 'compose-for-rethinkdb',
      // 'compose-for-scylladb',
      'icp',
      'exp',
      'mcv',
      'cfaas',
      'cp4d',
      'satellite-iaas',
      'globalcatalog-instance',
    ]
    tasks.push((callback) => {
      resources = resources.filter(resource =>
        ignoredResources.indexOf(resource.name) < 0 &&
        (resource.kind === 'iaas' || resource.kind === 'service') &&
        (!resource.group || resource.parent_url)
      );
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

        // add the region tag if missing
        if (resource.geo_tags) {
          for (const zoneTag of resource.geo_tags.filter(tag => tag.endsWith("-1"))) {
            resource.geo_tags.push(zoneTag.substring(0, zoneTag.indexOf("-1")));
          }
        } else {
          resource.geo_tags = [];
        }

        // inject custom tags
        resource.tags = resource.tags.concat(resource.pricing_tags || []).concat(resource.geo_tags || []);
        resource.tags.push(`custom_kind_${resource.kind}`);

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

        // make tags unique
        resource.geo_tags = [...new Set(resource.geo_tags)];
        resource.tags = [...new Set(resource.tags)];
        
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

    tasks.push((callback) => {
      getImages(resources, callback);
    });

    // save the full version
    tasks.push((callback) => {
      console.log('Writing full resource file...');
      const stream = fs.createWriteStream("../docs/generated/resources-full.json");
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
          'imageUrl',
          'localSvgIcon',
          'localPngIcon',
        ]);

        if (resource.metadata) {
          removeAllBut(resource.metadata, [
            'ui',
            'service'
          ]);
        }

        if (resource.metadata && resource.metadata.service) {
          removeAllBut(resource.metadata.service, [
            'cf_service_name',
          ]);
        }

        if (resource.metadata && resource.metadata.ui) {
          removeAllBut(resource.metadata.ui, [
            'hidden',
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
      const stream = fs.createWriteStream("../docs/generated/resources.json");
      stream.once('open', function (fd) {
        stream.write(JSON.stringify(resources, null, 2));
        stream.end();
      });
      stream.once('finish', () => { callback(null); });
    });

    return new Promise(function(resolve, reject) {
      async.waterfall(tasks, (err) => {
        if (err) {
          console.log('[KO]', err);
          reject(err);
        } else {
          console.log('[OK] Processing complete!');
          resolve(resources);
        }
      });
    });
  }
}

module.exports = function () {
  return new ServiceUpdater();
}
