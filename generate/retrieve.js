
function ServiceUpdater() {
  const apiUrl = 'https://globalcatalog.cloud.ibm.com/api/v1';
  
  const axios = require('axios');
  const fs = require('fs');
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

  async function getResources(url) {
    console.log('Retrieving', url);
    let allResources = [];
    
    let body;
    do {
      body = (await axios.get(url)).data;
      console.log(`Found ${body.resources.length} additional resources`);
      allResources = allResources.concat(body.resources.filter(resource => resource.active));
      // move to the next page if any
      url = body.next;
    } while (url)

    return allResources;
  }

  // find children of resource groups
  async function getChildren(resources) {
    for (const resource of resources.filter(resource => resource.group === true)) {
      console.log(`[${resource.name}] get children for ${apiUrl}/${resource.id}?complete=true&depth=*`);
      const body = (await axios.get(`${apiUrl}/${resource.id}?complete=true&depth=*`, {
        timeout: 5000,
      })).data;
      if (body.children) {
        body.children
          .filter(child => child.kind === 'iaas' || child.kind === 'service')
          .forEach((child) => {
            console.log(`[${resource.name}] Found ${child.id}`);
            resources.push(child);
          });
      }
    }
  }

  async function getPlans(resources) {
    for (const resource of resources) {
      console.log(`[${resource.name}] get plans ${apiUrl}/${resource.id}/plan?complete=true`);
      const body = (await axios.get(`${apiUrl}/${resource.id}/plan?complete=true`, {
        timeout: 5000,
      })).data;
      if (body.next) {
        console.log(`[${resource.name}] found a resource with a lot of plans!!!`);
      }
      resource.plans = body.resources.filter(plan => plan.active);
      resource.plans.forEach((plan) => {
        plan.description = plan.overview_ui['en'].description;
        plan.displayName = plan.overview_ui['en'].display_name;
        if (plan.metadata.plan && plan.metadata.plan.extra) {
          plan.metadata.plan.extra = JSON.parse(plan.metadata.plan.extra);
        } else {
          console.log(`[${resource.name}] plan ${plan.name} has no 'plan' metadata`);
        }
        plan.originalName = plan.metadata.original_name;
      });
    }
  }

  async function getImages(resources) {
    console.log('Retrieving icons...');
    for (const resource of resources) {
      let imageUrl = decodeURIComponent(resource.imageUrl);
      if (!imageUrl) {
        console.log(`[${resource.name}] ${resource.id} has no image!`);
      }
      console.log(`[${resource.name}] getting icon ${imageUrl}`);

      try {
        const body = (await axios.get(imageUrl, {
          timeout: 5000,
          responseType: 'arraybuffer',
        })).data;

        let extension;
        if (imageUrl.indexOf(".svg") > 0) {
          extension = "svg";
        } else {
          extension = "png";
        }

        fs.writeFileSync("../docs/generated/icons/" + resource.id + "." + extension, body);
        console.log(`[${resource.name}] wrote ${resource.id}.${extension}`);

        if (extension === "svg") {
          let imageBuffer = fs.readFileSync("../docs/generated/icons/" + resource.id + ".svg");
          // some svg are compressed
          try {
            imageBuffer = zlib.gunzipSync(imageBuffer);
          } catch (e) {
            // console.log(`Could not unzip buffer for ${resource.name}`);
          }
          var sharp = require('sharp');
          if (imageBuffer.length > 0) {
            resource.localSvgIcon = "/generated/icons/" + resource.id + "." + extension;
            try {
              imageBuffer = await sharp(imageBuffer)
                .resize(64, 64)
                .png()
                .toBuffer()
              fs.writeFileSync("../docs/generated/icons/" + resource.id + ".png", imageBuffer);
              console.log(`[${resource.name}] wrote png`);
              resource.localPngIcon = "/generated/icons/" + resource.id + ".png";
            } catch (convertError) {
              console.log(`[${resource.name}] could not convert SVG to PNG`);
              console.log(convertError);
            }
          }
        } else { // it is a png
          imageBuffer = await Jimp.read("../docs/generated/icons/" + resource.id + ".png");
          await imageBuffer.writeAsync("../docs/generated/icons/" + resource.id + ".png");
          resource.localPngIcon = "/generated/icons/" + resource.id + ".png";
        }
      } catch (err) {
        console.log(`[${resource.name}] could not read icon`, err.message);
        // console.log(err);
      }

      if (!resource.localPngIcon) {
        fs.copyFileSync("../docs/icons/default-service.png", "../docs/generated/icons/" + resource.id + ".png");
        resource.localPngIcon = "/generated/icons/" + resource.id + ".png";
      }
    }
  }

  function removeAllBut(object, keysToKeep) {
    Object.keys(object).forEach((key) => {
      if (keysToKeep.indexOf(key) < 0) {
        delete object[key];
      }
    });
  }

  async function getGeography(geoId, callback) {
    return (await axios.get(`${apiUrl}/${geoId}?depth=*`, {
      timeout: 5000,
    })).data;
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

  self.run = async function() {
    let resources;
    let geographies = [];

    // retrieve all geos
    // https://globalcatalog.cloud.ibm.com/api/v1?q=kind:geography
    for (const geoSummary of (await getResources(`${apiUrl}?q=kind:geography`))) {
      if (geoSummary.id == "global") {
        continue;
      }

      const geo = await getGeography(geoSummary.id);
      console.log('Got details for geo', geo.id);

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
    }

    console.log('Writing geographies.json...');
    fs.writeFileSync("../docs/generated/geographies.json", JSON.stringify(geographies, null, 2));

    // retrieve all resources
    resources = await getResources(`${apiUrl}?complete=true&q=kind:iaas kind:service`);
    console.log(`Found ${resources.length} resources`);

    // retrieve all children
    await getChildren(resources);
    
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
    resources = resources.filter(resource =>
      ignoredResources.indexOf(resource.name) < 0 &&
      (resource.kind === 'iaas' || resource.kind === 'service') &&
      (!resource.group || resource.parent_url)
    );

    
    // retrieve the plans
    await getPlans(resources);

    // sanitize the output
    for (const resource of resources) {
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
      if (!resource.images) {
        console.log('No images for', resource.id, resource.name)
      } else {
        resource.imageUrl = resource.images.image || resource.images.feature_image;
      }

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
    }

    // sort on display name
    resources.sort((resource1, resource2) => {
      return resource1.displayName.localeCompare(resource2.displayName);
    });

    await getImages(resources);

    // save the full version
    console.log('Writing full resource file...');
    fs.writeFileSync("../docs/generated/resources-full.json", JSON.stringify(resources, null, 2));
    
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
    fs.writeFileSync("../docs/generated/resources.json", JSON.stringify(resources, null, 2));

    return resources;
  }
}

module.exports = function () {
  return new ServiceUpdater();
}
