var fs = require('fs');
var path = require('path');

var services = JSON.parse(fs.readFileSync('public/data/services.json', 'utf8'));
var officegen = require('officegen');
var xlsx = officegen('xlsx');

sheet = xlsx.makeNewSheet();
sheet.name = 'My Bluemix Catalog';

var row = 1;

services.forEach(function (service) {
    if (!service.entity.active) {
        return;
    }

    // Header
    sheet.data[0] = [];
    sheet.data[0][0] = "Service";
    sheet.data[0][1] = "Description";
    sheet.data[0][2] = "Author";
    sheet.data[0][3] = "Long Description";
    sheet.data[0][4] = "URL";
    
    // Cell Content
    sheet.data[row] = [];

    /*
  try {
    p.addImage(path.resolve(__dirname, 'public/data/icons/' + service.metadata.guid + '.png'));
  } catch (err) {}
    */

    var extra = service.entity.extra;
    if (extra && extra.displayName) {
        sheet.data[row][0] = extra.displayName;
        sheet.data[row][1] = service.entity.description;
        sheet.data[row][2] = extra.providerDisplayName;
        sheet.data[row][3] = extra.longDescription;
        sheet.data[row][4] = extra.documentationUrl;
    } else {
        sheet.data[row][0] = service.entity.label;
        sheet.data[row][1] = service.entity.description;
        sheet.data[row][2] = service.entity.provider;
    }

    row++;
});

var out = fs.createWriteStream('public/data/catalog.xlsx');
xlsx.generate(out);
