var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var moment = require('moment');
var officegen = require('officegen');

// Added to loop through the region
var vm = require('vm');
var script = vm.createScript(fs.readFileSync('./public/js/cloud-configuration.js'));
var sandbox = {};
script.runInNewContext(sandbox);
var regions = sandbox.regions;
var categories = sandbox.catalogCategories;

router.post('/:format/:locale?', function (req, res) {
  var resources = JSON.parse(fs.readFileSync('public/generated/resources-full.json', 'utf8'));
  var services = resources.filter(service => service.kind === 'service' || service.kind === 'iaas');

  var servicesToExport;
  var userSelectedServices = req.body["resources"];

  if (userSelectedServices) {
    servicesToExport = services.filter(function (service) {
      return userSelectedServices.indexOf(service.id) >= 0;
    });
  } else {
    servicesToExport = services;
  }

  // default to english
  const locale = req.params.locale || 'en';
  console.log(`Exporting ${servicesToExport.length} services with format ${req.params.format} and locale ${locale}`);

  var officeDocument;
  // Get the date of the office export
  var date = new Date();
  var dateYMD = moment(date).format('YYYY-MM-DD');
  var dateMDY = moment(date).format('MMMM DD, YYYY');

  switch (req.params.format) {
    case "xlsx":
      officeDocument = exportToExcel(servicesToExport, dateMDY, res);
      break;
    case "docx":
      officeDocument = exportToWord(servicesToExport, dateMDY, res);
      break;
    case "pptx":
      officeDocument = exportToPowerpoint(locale, servicesToExport, dateMDY, res);
      break;
    default:
      res.status(500).send({
        error: "unknown format " + req.params.format
      })
  }

  if (officeDocument) {
    const filename = `mycatalog-${dateYMD}-${locale}.${req.params.format}`
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename=${filename}`);
    officeDocument.generate(res);
  }
});

// ---------------------------------------------------------------------
// API Export to XLSX
// ---------------------------------------------------------------------
function exportToExcel(services, dateMDY, res) {
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

    // Cell Content
    sheet.data[row] = [];
    sheet.data[row][0]  = service.displayName;
    
    for (var category in categories) {
      if (sandbox.matchesCategory(service, categories[category])) {
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
    for (var region in regions) {
      if (service.tags.indexOf(regions[region].tag) >= 0) {
        datacenter += regions[region].label + " ";
      }
    }
    sheet.data[row][7] = datacenter;

    sheet.data[row][8] = moment(service.created).format('YYYY-MM-DD');
    sheet.data[row][9] = moment(service.updated).format('YYYY-MM-DD');
    sheet.data[row][10] = service.description;
    sheet.data[row][11] = service.metadata.ui.urls.doc_url;

    row++;
  });

  //--------------------------------------------------------------------
  // New Excel tab to add plans & pricing - To be continued
  //--------------------------------------------------------------------
  /**
  var countryToCurrency = {};

  // find all the possible currencies
  services.forEach(function (service) {
    service.plans.forEach(function (plan) {
      if (plan.metadata.plan && plan.metadata.plan.extra && plan.metadata.plan.extra.costs) {
        plan.metadata.plan.extra.costs.forEach(function (cost) {
          if (cost.currencies) {
            cost.currencies.forEach(function (currency) {
              if (!countryToCurrency[currency.country]) {
                countryToCurrency[currency.country] = Object.keys(currency.amount)[0];
              }
            });
          } else {
            //cost.amount
          }
        });
      }
    });
  });

  // add one tab per country
  Object.keys(countryToCurrency).sort().forEach(function(country) {
    var sheet2 = xlsx.makeNewSheet();
    sheet2.name = `(BETA) Pricing - ${country} - ${countryToCurrency[country]}`;
    fillPricingSheet(sheet2, services, country, countryToCurrency[country]);
  });
  */
  return xlsx;
}

/*
function fillPricingSheet(sheet2, services, currentCountry, currentCurrency) {
  var SERVICE_COLUMN_INDEX = 0;
  var PLAN_COLUMN_INDEX = 1;
  var SUBSCRIPTION_COLUMN_INDEX = 2;
  var COST_UNIT_COLUMN_INDEX = 3;
  var AMOUNT_COLUMN_INDEX = 4;
  var TIER_COLUMN_INDEX = 5;
  var DESCRIPTION_COLUMN_INDEX = 6;
  var columnNameToColumnIndex = {
    "Service": SERVICE_COLUMN_INDEX,
    "Plan": PLAN_COLUMN_INDEX,
    "Subscription": SUBSCRIPTION_COLUMN_INDEX,
    "Cost Unit": COST_UNIT_COLUMN_INDEX,
    "Amount": AMOUNT_COLUMN_INDEX,
    "Tier": TIER_COLUMN_INDEX,
    "Description": DESCRIPTION_COLUMN_INDEX
  }
  // Table Header
  sheet2.data[0] = [];
  Object.keys(columnNameToColumnIndex).forEach(function(key) {
    sheet2.data[0][columnNameToColumnIndex[key]] = key;
  });

  // First row after the header
  var rowp = 3;

  services.forEach(function (service) {
    var extra = service.metadata.service.extra;
    var svcName = service.displayName;

    var plans = service.plans;
    // Iterate through array of plans
    plans.forEach(function (plan) {
      var planDescription = plan.description;
      var planName = plan.displayName;

      // New row for Free plan (ex: AlchemyAPI) or
      // Free service w/o any cost array (ex: Access Trail, Active Deploy)
      //console.log(rowp, svcName, planName)
      sheet2.data[rowp] = [];
      sheet2.data[rowp][SERVICE_COLUMN_INDEX] = svcName;
      sheet2.data[rowp][PLAN_COLUMN_INDEX] = planName;
      sheet2.data[rowp][DESCRIPTION_COLUMN_INDEX] = planDescription;

      // Set amount to zero if plan if free.
      if (plan.pricing_tags.indexOf('free')>=0) {
        sheet2.data[rowp][AMOUNT_COLUMN_INDEX] = 0;
        // A free plan can always be consumed with a subscription
        sheet2.data[rowp][SUBSCRIPTION_COLUMN_INDEX] = 'yes';
        rowp++; return;
      }

      // Most of the services have multiple plans including cost and currencies
      // Warning: some plans have one single plan with multiple tier (cost)
      if (plan.metadata.plan && plan.metadata.plan.extra) {
        var extrap = plan.metadata.plan.extra;
        var costs = extrap.costs;
        if (costs) {
          costs.forEach(function (cost) {
            // New row per cost
            sheet2.data[rowp] = [];
            sheet2.data[rowp][SERVICE_COLUMN_INDEX] = svcName;
            sheet2.data[rowp][PLAN_COLUMN_INDEX] = planName;
            sheet2.data[rowp][COST_UNIT_COLUMN_INDEX] = cost.unit;
            var currencies = cost.currencies;
            if (currencies) {
              currencies.forEach(function (currency) {
                if (currency.country != currentCountry || !currency.amount[currentCurrency]) {
                  return;
                }

                var amount = currency.amount[currentCurrency];

                if (cost.tierModel && cost.quantityTier != 1)
                  sheet2.data[rowp][TIER_COLUMN_INDEX] = " < " + cost.unitQuantity * cost.quantityTier;

                // Price is often given for 1 000 API Call in JSON
                // So need to derive the price per API call
                if (cost.unitQuantity)
                  amount = amount / cost.unitQuantity;
                sheet2.data[rowp][AMOUNT_COLUMN_INDEX] = amount;
              });
            } else {
              // Handle simple cost plan (ex: Statica service)
              if (cost.amount) {
                sheet2.data[rowp][AMOUNT_COLUMN_INDEX] = cost.amount[currentCurrency];
              }
            }
            //console.log(rowp, svcName, planName, amount);
            //console.log(rowp, svcName, planName);

            // Plan Description
            var description = "";
            if (plan.metadata.plan.extra.bullets) {
              plan.metadata.plan.extra.bullets.forEach(function (bullet, index) {
                description = description + (index > 0 ? ", " : "") + bullet;
              });
            } else {
              description = planDescription;
            }
            sheet2.data[rowp][DESCRIPTION_COLUMN_INDEX] = description;

            // ---------------
            // Determine whether or not the service is available through a Subscription or needs to be order/purchase through a sales rep
            var withSubscription;
            // By default, all services are available through subscription
            if (extrap && extrap.subscription)
              withSubscription = 'yes';
            if (plan.pricing_tags.indexOf('free')>=0)
              withSubscription = 'yes';
            // Some services are not using the tag reservable :-(
            // The only way to find out whether the service is available within a subscription is to look at the plan description... dirty... but it works with those 3 keywords!!
            // Exemple: dahsDB - Enterprise for Transactions 2.8.500
            if ((planDescription.indexOf('order') !== -1) ||
                (planDescription.indexOf('sales rep') !== -1))
              withSubscription = 'no'
            // Watson Premium services are not available by Subscription
            if ((planDescription.indexOf('Premium') !== -1) &&
                (planDescription.indexOf('watson') !== -1))
              withSubscription = 'no'
            if (!withSubscription)
              withSubscription = 'yes'

            var isReservable
            if (extrap && extrap.reservable) {
              isReservable = 'reservable'
                // Reservable plan cannot be used with a subscription
              withSubscription = 'no'
            }
            sheet2.data[rowp][SUBSCRIPTION_COLUMN_INDEX] = withSubscription;
            // ---------------

            rowp++;
          });
        }
      }
    });
  });
}
*/

// ---------------------------------------------------------------------
// API Export to PPTX
// ---------------------------------------------------------------------
function exportToPowerpoint(locale, services, dateMDY, res) {
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
  slide.addImage(path.resolve(__dirname, 'public/icons/ibmcloud_logo.png'), {
    x: 1000,
    y: 30,
    cx: 150,
    cy: 100,
  });

  // One slide per service
  services.forEach(function (service) {
    slide = pptx.makeNewSlide();

    try {
      slide.addImage(path.resolve(__dirname, 'public/generated/icons/' + service.id + '.png'), {
        x: 50,
        y: 30,
        cx: 64,
        cy: 64
      });
      slide.addImage(path.resolve(__dirname, 'public/icons/ibmcloud_logo.png'), {
        x: 1000,
        y: 30,
        cx: 100,
        cy: 70
      });
    } catch (err) {}

    try {
      dname = service.overview_ui[locale].display_name  
    } catch (error) {
      dname = service.description
    }
    slide.addText(dname, {
      x: 150,
      y: 30,
      cx: '900',
      font_size: 30,
      bold: true
    });

    try {
      desc = service.overview_ui[locale].description  
    } catch (error) {
      desc = service.description
    }
    slide.addText(desc, {
      x: 100,
      y: 150,
      cx: '1000',
      font_size: 20,
      color: '808080'
    });

    try {
      longDesc = service.overview_ui[locale].long_description
    } catch (error) {
      longDesc = service.longDescription
    }
    slide.addText(longDesc, {
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
      if (sandbox.matchesCategory(service, categories[category])) {
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
    for (var region in regions) {
      if (service.tags.indexOf(regions[region].tag) >= 0) {
        datacenter += regions[region].label + " ";
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
function exportToWord(services, dateMDY, res) {
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
      p.addImage(path.resolve(__dirname, 'public/generated/icons/' + service.id + '.png'), {
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

module.exports = router;
