var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();

var services = JSON.parse(fs.readFileSync('public/generated/services.json', 'utf8'));
var officegen = require('officegen');


// ---------------------------------------------------------------------
// API Export to XLSX
// ---------------------------------------------------------------------
router.get('/xlsx', function (req, res) {
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
    sheet.data[0][1] = "Category";
    sheet.data[0][2] = "Description";
    sheet.data[0][3] = "Author";
    sheet.data[0][4] = "Long Description";
    sheet.data[0][5] = "URL";

    // Cell Content
    sheet.data[row] = [];

    var extra = service.entity.extra;
    if (extra && extra.displayName) {
      sheet.data[row][0] = extra.displayName;
      sheet.data[row][1] = service.entity.tags[0];
      sheet.data[row][2] = service.entity.description;
      sheet.data[row][3] = extra.providerDisplayName;
      sheet.data[row][4] = extra.longDescription;
      sheet.data[row][5] = extra.documentationUrl;
    } else {
      sheet.data[row][0] = service.entity.label;
      sheet.data[row][1] = service.entity.tags[0];
      sheet.data[row][2] = service.entity.description;
      sheet.data[row][3] = service.entity.provider;
    }

    row++;
  });

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", "inline; filename=catalog.xlsx");
  xlsx.generate(res);
});

// ---------------------------------------------------------------------
// API Export to PPTX
// ---------------------------------------------------------------------
router.get('/pptx', function (req, res) {
  var pptx = officegen('pptx');

  pptx.setWidescreen(true);

  services.forEach(function (service) {
    if (!service.entity.active) {
      return;
    }

    // New slide
    slide = pptx.makeNewSlide();

    try {
      slide.addImage(path.resolve(__dirname, 'public/generated/icons/' + service.metadata.guid + '.png'), {
        x: 50,
        y: 30,
        cx: 70,
        cy: 70
      });
      slide.addImage(path.resolve(__dirname, 'public/icons/bluemix_logo.png'), {
        x: 1100,
        y: 30,
        cx: 70,
        cy: 70
      });
    } catch (err) {}

    var extra = service.entity.extra;
    if (extra && extra.displayName) {
      slide.addText(extra.displayName, {
        x: 150,
        y: 30,
        cx: '100%',
        font_size: 30,
        bold: true
      });

      slide.addText(service.entity.description, {
        x: 100,
        y: 150,
        cx: '1100',
        font_size: 20,
        color: '808080'
      });

      slide.addText(extra.longDescription, {
        x: 100,
        y: 250,
        cx: '1100',
        font_size: 20
      });

      slide.addText("Author: ", {
        x: 100,
        y: 530,
        cx: '100%',
        font_size: 20,
        bold: true
      });
      slide.addText(extra.providerDisplayName, {
        x: 200,
        y: 530,
        cx: '100%',
        font_size: 20
      });

      slide.addText(extra.documentationUrl, {
        x: 100,
        y: 600,
        cx: '100%',
        cy: 20,
        color: '0000ff'
      });

      slide.addText(slide.getPageNumber(), {
        x: 1150,
        y: 630,
        cx: '100',
        cy: 20,
        color: '808080'
      });
    } else {
      slide.addText(service.entity.label, {
        x: 150,
        y: 30,
        cx: '100%',
        font_size: 30,
        bold: true
      });

      slide.addText(service.entity.description, {
        x: 100,
        y: 150,
        cx: '100%',
        font_size: 20
      });

      //bug slide.addText(service.entity.provider,   {x: 100, y: 300, cx: '100%'});
    }

  });

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", "inline; filename=catalog.pptx");
  pptx.generate(res);
});

// ---------------------------------------------------------------------
// API Export to DOCX
// ---------------------------------------------------------------------
router.get('/docx', function (req, res) {
  var docx = officegen('docx');

  services.forEach(function (service) {
    if (!service.entity.active) {
      return;
    }

    var p = docx.createP();

    try {
      p.addImage(path.resolve(__dirname, 'public/generated/icons/' + service.metadata.guid + '.png'));
    } catch (err) {}

    var extra = service.entity.extra;
    if (extra && extra.displayName) {
      p.addText(extra.displayName, {
        bold: true
      });
    } else {
      p.addText(service.entity.label, {
        bold: true
      });
    }

    p.addLineBreak();
    p.addText(service.entity.description);
  });

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", "inline; filename=catalog.docx");
  docx.generate(res);
});

module.exports = router;
