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
  var services = resources.filter(service => service.kind === 'service' || service.kind === 'iaas');
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
  sheet0 = xlsx.makeNewSheet();
  sheet0.name = 'Disclaimer';
  sheet0.data[0] = [];
  sheet0.data[0][0] = "Disclaimer";
  sheet0.data[1] = [];
  sheet0.data[1][0] = "The list of services in this document was extracted from the IBM Cloud Catalog using the public catalog API.";
  sheet0.data[2] = [];
  sheet0.data[2][0] = "This content attempts to be as accurate as possible.";
  sheet0.data[3] = [];
  sheet0.data[3][0] = "Use with care and refer to the official IBM Cloud Catalog https://cloud.ibm.com/catalog#services.";

  sheet = xlsx.makeNewSheet();
  sheet.name = 'My Catalog';

  var row = 1;

  services.forEach(function (service) {
    // Header
    sheet.data[0] = [];
    sheet.data[0][0] = "Service";
    sheet.data[0][1] = "Category";
    sheet.data[0][2] = "Id";
    sheet.data[0][3] = "Provider";
    sheet.data[0][4] = "Status";
    sheet.data[0][5] = "Free Plan";
    sheet.data[0][6] = "Plans";
    sheet.data[0][7] = "Regions";
    sheet.data[0][8] = "Creation Date";
    sheet.data[0][9] = "Last Modification";
    sheet.data[0][10] = "Description";
    sheet.data[0][11] = "URL";
    sheet.data[0][12] = "Tags"

    // Cell Content
    sheet.data[row] = [];
    sheet.data[row][0]  = service.displayName;
    
    for (var category in categories) {
      if (matchesCategory(service, categories[category])) {
        sheet.data[row][1] = categories[category].label;
        break;
      }
    }

    sheet.data[row][2] = service.id;
    sheet.data[row][3] = service.provider.name;

    var status = "";
    if (service.tags.indexOf('ibm_beta') >= 0)
      status = "Beta";
    else if (service.tags.indexOf('ibm_experimental') >= 0)
      status = "Experimental";
    else if (service.tags.indexOf('ibm_deprecated') >= 0)
        status = "Deprecated";
    else
      status = "Production Ready";
    sheet.data[row][4] = status;
    sheet.data[row][5] = (service.tags.indexOf("free") >= 0) ? "Yes" : "No";

    var planList = "";
    var plans = service.plans;
    for (var plan in plans) {
      planList += plans[plan].displayName + "\n";
    }
    sheet.data[row][6] = planList;

    var datacenter = "";
    for (const geo of geographies) {
      for (const region of geo.regions) {
        if (service.tags.indexOf(region.tag) >= 0) {
          datacenter += region.label + " ";
        }
      }
    }
    sheet.data[row][7] = datacenter;

    sheet.data[row][8] = moment(service.created).format('YYYY-MM-DD');
    sheet.data[row][9] = moment(service.updated).format('YYYY-MM-DD');
    sheet.data[row][10] = service.description;
    sheet.data[row][11] = service.metadata.ui.urls.doc_url;
    sheet.data[row][12] = service.tags.join(", ");
    row++;
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

    // Metada rectangle panel on the right hand side
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
    // Metada rectangle panel on the right hand side END

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
    if (! url.includes('http') ) url = 'https://cloud.ibm.com' + url;
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
