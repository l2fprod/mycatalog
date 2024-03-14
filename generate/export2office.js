var fs = require('fs');
var path = require('path');
var moment = require('moment');
var officegen = require('officegen');

function matchesCategory(resource, category) {
  return resource.tags.filter(function(tag) {
    return category.tags.indexOf(tag) >= 0  ||
      category.tags.indexOf(resource.name) >= 0;
  }).length > 0;
}

const categories = JSON.parse(fs.readFileSync('../docs/js/categories.json', 'utf-8'));
const geographies = JSON.parse(fs.readFileSync('../docs/generated/geographies.json', 'utf-8'));

async function generate(format, filename) {
  var resources = JSON.parse(fs.readFileSync('../docs/generated/resources-full.json', 'utf8'));
  // Returns all active services
  var services = resources.filter(service => (service.kind === 'service' || service.kind === 'iaas') && service.active);
  var servicesToExport = services;

  console.log("Exporting", servicesToExport.length, "services in", format);

  var officeDocument;
  // Get the date of the office export
  var date = new Date();
  var dateYMD = moment(date).format('YYYY-MM-DD');
  var dateMDY = moment(date).format('MMMM DD, YYYY');

  switch (format) {
    case "xlsx":
      officeDocument = exportToExcel(servicesToExport, dateMDY);
      break;
    case "docx":
      officeDocument = exportToWord(servicesToExport, dateMDY);
      break;
    case "pptx":
      officeDocument = exportToPowerpoint(servicesToExport, dateMDY);
      break;
    default:
      throw new Error({
        error: "unknown format " + format
      });
  }

  const output = fs.createWriteStream(filename);
  return officeDocument.generate(output);
}

// ---------------------------------------------------------------------
// API Export to XLSX
// ---------------------------------------------------------------------
function exportToExcel(services, dateMDY) {
  var xlsx = officegen('xlsx');

  // Disclaimer
  sDisclaimer = xlsx.makeNewSheet();
  sDisclaimer.name = 'Disclaimer';
  sDisclaimer.data[0] = [];
  sDisclaimer.data[0][0] = "Disclaimer";
  sDisclaimer.data[1] = [];
  sDisclaimer.data[1][0] = "The list of services in this document was extracted from the IBM Cloud Catalog using the Global Catalog API.";
  sDisclaimer.data[2] = [];
  sDisclaimer.data[2][0] = "This content attempts to be as accurate as possible.";
  sDisclaimer.data[3] = [];
  sDisclaimer.data[3][0] = "Use with care and refer to the official IBM Cloud Catalog https://cloud.ibm.com/catalog#services.";

  //
  // MY CATALOG
  //

  sCatalog = xlsx.makeNewSheet();
  sCatalog.name = 'My Catalog';

  var row = 1;

  services.forEach(function (service) {
    // Header
    sCatalog.data[0] = [];
    sCatalog.data[0][0] = "Service Name";
    sCatalog.data[0][1] = "Service Id";
    sCatalog.data[0][2] = "Category";
    sCatalog.data[0][3] = "Classic Infra";
    sCatalog.data[0][4] = "Provider";
    sCatalog.data[0][5] = "FS Validated";
    sCatalog.data[0][6] = "CBR Support";
    sCatalog.data[0][7] = "EU Access";
    sCatalog.data[0][8] = "Status";
    sCatalog.data[0][9] = "Free Plan";
    sCatalog.data[0][10] = "Plans";
    sCatalog.data[0][11] = "Regions";
    sCatalog.data[0][12] = "Creation Date";
    sCatalog.data[0][13] = "Last Modification";
    sCatalog.data[0][14] = "Description";
    sCatalog.data[0][15] = "URL";
    sCatalog.data[0][16] = "Tags"

    // Cell Content
    sCatalog.data[row] = [];
    sCatalog.data[row][0]  = service.displayName;
    sCatalog.data[row][1] = service.id;

    for (var category in categories) {
      if (matchesCategory(service, categories[category])) {
        sCatalog.data[row][2] = categories[category].label;
        break;
      }
    }

    sCatalog.data[row][3] = (service.tags.indexOf("custom_kind_iaas") >= 0) ? "Classic" : "No";
    sCatalog.data[row][4] = service.provider.name;
    sCatalog.data[row][5] = (service.tags.indexOf("fs_ready") >= 0) ? "Yes" : "No";
    sCatalog.data[row][6] = (service.tags.indexOf("cbr_enabled") >= 0) ? "Yes" : "No";
    sCatalog.data[row][7] = (service.tags.indexOf("eu_access") >= 0) ? "Yes" : "No";
    
    var status = "";
    if (service.tags.indexOf('ibm_beta') >= 0)
      status = "Beta";
    else if (service.tags.indexOf('ibm_experimental') >= 0)
      status = "Experimental";
    else if (service.tags.indexOf('ibm_deprecated') >= 0)
        status = "Deprecated";
    else
      status = "Production Ready";

    sCatalog.data[row][8] = status;
    sCatalog.data[row][9] = (service.tags.indexOf("free") >= 0) ? "Yes" : "No";

    var planList = "";
    var plans = service.plans;
    for (var plan in plans) {
      planList += plans[plan].displayName + "\n";
    }
    sCatalog.data[row][10] = planList;

    var datacenter = "";
    for (const geo of geographies) {
      for (const region of geo.regions) {
        if (service.tags.indexOf(region.tag) >= 0) {
          datacenter += region.label + "\n";
        }
      }
    }
    sCatalog.data[row][11] = datacenter;

    sCatalog.data[row][12] = moment(service.created).format('YYYY-MM-DD');
    sCatalog.data[row][13] = moment(service.updated).format('YYYY-MM-DD');
    sCatalog.data[row][14] = service.description;
    sCatalog.data[row][15] = service.metadata.ui.urls.doc_url
    sCatalog.data[row][16] = service.tags.join(", ");
    row++;
  });

  //
  // MY PLANS
  //

  sPlans = xlsx.makeNewSheet();
  sPlans.name = 'My Plans';

  // get the list of regions
  let allGeoTags = new Set();
  services.forEach(service => {
    service.plans.forEach(plan => {
      if (plan.geo_tags) {
        plan.geo_tags.forEach(tag => allGeoTags.add(tag));
      } else {
        console.log(`No geo_tags for ${service.name} ${plan.name}`);
      }
    });
  });
  allGeoTags = Array.from(allGeoTags);
  allGeoTags.sort();

  sPlans.data[0] = [
    "Service Name",
    "Service ID",
    "Plan Name",
    "Plan ID"
  ].concat(allGeoTags);

  row = 1;
  services.forEach(service => {
    service.plans.forEach(plan => {
      sPlans.data[row] = [
        service.displayName,
        service.id,
        plan.displayName,
        plan.id
      ].concat(allGeoTags.map(tag => plan.geo_tags ? (plan.geo_tags.indexOf(tag) >= 0 ? "X" : "") : ""));
      row++;
    });
  });

  return xlsx;
}

// ---------------------------------------------------------------------
// API Export to PPTX
// ---------------------------------------------------------------------
function exportToPowerpoint(services, dateMDY) {
  var pptx = officegen('pptx');

  pptx.setWidescreen(true);

  // Intro slide --------------------
  slide = pptx.makeNewSlide();
  //slide.back = '1E3648';
  slide.addText("My Catalog", {
    x: 150,
    y: 100,
    cx: '100%',
    font_size: 40,
    bold: true,
    color: '2a6d9e'
  });
  slide.addText("Exported on " + dateMDY, {
    x: 150,
    y: 180,
    cx: '100%',
    font_size: 40,
    bold: true,
    color: '2a6d9e'
  });
  slide.addText("The list of services in this document was extracted from the IBM Cloud catalog using the public catalog API. This content attempts to be as accurate as possible. Use with care and refer to the official IBM Cloud Catalog https://cloud.ibm.com/catalog#services.", {
    x: 150,
    y: 500,
    cx: '900',
    font_size: 20,
    bold: false,
    color: 'ff0000'
  });
  slide.addImage(path.resolve(__dirname, '../docs/icons/ibmcloud_logo.png'), {
    x: 1000,
    y: 30,
    cx: 150,
    cy: 100,
  });

  // One slide per service
  services.forEach(function (service) {
    slide = pptx.makeNewSlide();

    try {
      slide.addImage(path.resolve(__dirname, '../docs/generated/icons/' + service.id + '.png'), {
        x: 50,
        y: 30,
        cx: 70,
        cy: 70
      });
      slide.addImage(path.resolve(__dirname, '../docs/icons/ibmcloud_logo.png'), {
        x: 1000,
        y: 30,
        cx: 100,
        cy: 70
      });
    } catch (err) {}

    slide.addText(service.displayName, {
      x: 150,
      y: 30,
      cx: '900',
      font_size: 30,
      bold: true
    });

    slide.addText(service.description, {
      x: 100,
      y: 150,
      cx: '1000',
      font_size: 20,
      color: '808080'
    });

    slide.addText(service.longDescription, {
      x: 100,
      y: 300,
      cx: '700',
      font_size: 18
    });

    // Metadata rectangle panel on the right hand side
    slide.addShape("rect", {
      x: 830,
      y: 230,
      cx: 390,
      cy: 350,
      fill: '47A9C0'
    });
    slide.addText("Provider: ", {
      x: 850,
      y: 250,
      cx: '150',
      font_size: 18,
      bold: false,
      color: 'ffffff'
    });
    slide.addText(service.provider.name, {
      x: 1000,
      y: 250,
      cx: '220',
      font_size: 18,
      color: 'ffffff',
      bold: false
    });
    slide.addText("Category: ", {
      x: 850,
      y: 300,
      cx: '150',
      font_size: 18,
      bold: false,
      color: 'ffffff'
    });
    for (var category in categories) {
      if (matchesCategory(service, categories[category])) {
        cat = categories[category].label;
        slide.addText(cat, {
          x: 1000,
          y: 300,
          cx: '300',
          font_size: 18,
          color: 'ffffff',
          bold: false
        });
        break;
      }
    }
    slide.addText("Status: ", {
      x: 850,
      y: 350,
      cx: '150',
      font_size: 18,
      color: 'ffffff'
    });

    var status = "";
    if (service.tags.indexOf('ibm_beta') >= 0)
      status = "Beta";
    else if (service.tags.indexOf('ibm_experimental') >= 0)
      status = "Experimental";
    else
      status = "Production Ready";
    slide.addText(status, {
      x: 1000,
      y: 350,
      cx: '200',
      font_size: 18,
      color: 'ffffff',
      bold: false
    });
    slide.addText("Free Plan: ", {
      x: 850,
      y: 400,
      cx: '150',
      font_size: 18,
      color: 'ffffff'
    });
    var isFreePlan = (service.tags.indexOf("free") >= 0) ? "Yes" : "No";
    slide.addText(isFreePlan, {
      x: 1000,
      y: 400,
      cx: '200',
      font_size: 18,
      color: 'ffffff',
      bold: false
    });
    slide.addText("Regions: ", {
      x: 850,
      y: 450,
      cx: '150',
      font_size: 18,
      color: 'ffffff'
    });
    var datacenter = "";
    for (const geo of geographies) {
      for (const region of geo.regions) {
        if (service.tags.indexOf(region.tag) >= 0) {
          datacenter += region.label + " ";
        }
      }
    }
    slide.addText(datacenter, {
      x: 1000,
      y: 450,
      cx: '200',
      font_size: 18,
      color: 'ffffff',
      bold: false
    });
    // Metadata rectangle panel on the right hand side END

    // Catalog URL
    var url;
    if (service.kind === 'service') {
      url = 'https://cloud.ibm.com/catalog/services/' + service.name;
    } else {
      url = 'https://cloud.ibm.com/catalog/infrastructure/' + service.name;
    }
    slide.addText(url, {
      link: url,
      x: 100,
      y: 600,
      cx: '1000',
      font_size: 14,
      color: '808080'
    });

    slide.addText(slide.getPageNumber() + 1, {
      x: 1150,
      y: 630,
      cx: '100',
      cy: 20,
      color: '808080'
    });
  });

  return pptx;
}

// ---------------------------------------------------------------------
// API Export to DOCX
// ---------------------------------------------------------------------
function exportToWord(services, dateMDY) {
  var docx = officegen('docx');

  var introPage = docx.createP();
  introPage.addText("Disclaimer: The list of services in this document was extracted from the IBM Cloud catalog using the public catalog API. This content attempts to be as accurate as possible. Use with care and refer to the official IBM Cloud Catalog https://cloud.ibm.com/catalog#services.", 
    {
      color: '#ff0000',
      font_size: 12,
      italic: true
    });
  introPage.addLineBreak();

  services.forEach(function (service) {
    var p = docx.createP();

    try {
      p.addImage(path.resolve(__dirname, '../docs/generated/icons/' + service.id + '.png'), {
        cx: 50,
        cy: 50
      });
    } catch (err) {}

    p.addText('     ' + service.displayName, {
      bold: true,
      verticalAlign: true,
      font_size: 14
    });
    p.addLineBreak();
    p.addLineBreak();
    var description;
    // To export into a specific language:
    // if (extra.i18n && extra.i18n.fr && extra.i18n.fr.metadata) {
    //   description = extra.i18n.fr.metadata.longDescription;
    //   // If long description is not available, pick the short one
    //   if (!description) description = extra.i18n.fr.description;
    // }
    if (!description) description = service.longDescription;
    p.addText(description, {
        font_size: 12,
        color: '808080'
    });
    // p.addLineBreak();
    // p.addText('Provider:  ', {
    //   font_size: 12,
    //   color: '808080'
    // });
    // p.addText(service.provider.name, {
    //   font_size: 12
    // });
    p.addLineBreak();
    p.addText('Documentation:  ', {
      font_size: 12,
      color: '808080'
    });
    var url = service.metadata.ui.urls.doc_url;
    // Some services do not have doc link :-(
    if (url == undefined) url = 'https://cloud.ibm.com/docs';
    // Skytap doc url mess up all the other services after Skytap in alphabetic order
    if (service.displayName.includes('Skytap')) url = 'https://cloud.ibm.com/catalog';
    // Some services are missing the first part of the url
    if (! url.startsWith('http') ) url = 'https://cloud.ibm.com' + url;
    // escape url characters
    url = url.replace("&", "&amp;");

    p.addText (url, { link: url },{
        font_size: 12,
        color: '808080'
      });
    p.addLineBreak();
    p.addLineBreak();
  });
  return docx;
}

module.exports = {
  generate
};
