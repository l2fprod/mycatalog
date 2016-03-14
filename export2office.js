var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var moment = require('moment');

var services = JSON.parse(fs.readFileSync('public/generated/services.json', 'utf8'));
var officegen = require('officegen');

// Get the date of the office export
var date = new Date();
var genDate = moment(date).format('YYYYMMDD');

router.post('/:format', function (req, res) {
    var servicesToExport;
    var userSelectedServices = req.body["services[]"];

    if (userSelectedServices) {
        servicesToExport = services.filter(function (service) {
            return userSelectedServices.indexOf(service.metadata.guid) >= 0;
        });
    } else {
        servicesToExport = services;
    }

    console.log("Exporting", servicesToExport.length, "services in", req.params.format);

    switch (req.params.format) {
        case "xlsx":
            exportToExcel(servicesToExport, res);
            break;
        case "docx":
            exportToWord(servicesToExport, res);
            break;
        case "pptx":
            exportToPowerpoint(servicesToExport, res);
            break;
        default:
            res.status(500).send({
                error: "unknown format " + req.params.format
            })
    }

});

// ---------------------------------------------------------------------
// API Export to XLSX
// ---------------------------------------------------------------------
function exportToExcel(services, res) {
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
        sheet.data[0][4] = "Creation Date";
        sheet.data[0][5] = "Last Modification";
        sheet.data[0][6] = "Long Description";
        sheet.data[0][7] = "URL";

        // Cell Content
        sheet.data[row] = [];

        var extra = service.entity.extra;
        if (extra && extra.displayName) {
            sheet.data[row][0] = extra.displayName;
            sheet.data[row][1] = service.entity.tags[0];
            sheet.data[row][2] = service.entity.description;
            sheet.data[row][3] = extra.providerDisplayName;
            sheet.data[row][6] = extra.longDescription;
            sheet.data[row][7] = extra.documentationUrl;
        } else {
            sheet.data[row][0] = service.entity.label;
            sheet.data[row][1] = service.entity.tags[0];
            sheet.data[row][2] = service.entity.description;
            sheet.data[row][3] = service.entity.provider;
        }
        sheet.data[row][4] = service.metadata.created_at;
        sheet.data[row][5] = service.metadata.updated_at;

        row++;
    });

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "inline; filename=catalog-" + genDate + ".xlsx");
    xlsx.generate(res);
}

// ---------------------------------------------------------------------
// API Export to PPTX
// ---------------------------------------------------------------------
function exportToPowerpoint(services, res) {
    var pptx = officegen('pptx');

    pptx.setWidescreen(true);

    // Intro slide
    /*
    slide = pptx.makeNewSlide();
    slide.addText("Catalog exported on " + genDate, {
        x: 150,
        y: 30,
        cx: '100%',
        font_size: 30,
        bold: true
    });
     slide.addText("This catalog uses the Cloudfoundry API to retrieve data from the Bluemix US catalog. It tries to be as accurate as possible. Use with care." + genDate, {
        x: 150,
        y: 30,
        cx: '100%',
        font_size: 30,
        bold: true
    });
    */

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

            slide.addText(slide.getPageNumber()+1, {
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
    res.setHeader("Content-Disposition", "inline; filename=catalog-" + genDate + ".pptx");
    pptx.generate(res);
}

// ---------------------------------------------------------------------
// API Export to DOCX
// ---------------------------------------------------------------------
function exportToWord(services, res) {
    var docx = officegen('docx');

    services.forEach(function (service) {
        if (!service.entity.active) {
            return;
        }

        var p = docx.createP();

        try {
            p.addImage(path.resolve(__dirname, 'public/generated/icons/' + service.metadata.guid + '.png'), {
                cx: 70,
                cy: 70
            });
        } catch (err) {}

        var extra = service.entity.extra;

        var svcName = (extra && extra.displayName) ? extra.displayName : service.entity.label;
        var author = (extra && extra.providerDisplayName) ? extra.providerDisplayName : service.entity.provider;
        var doc = (extra && extra.documentationUrl) ? extra.documentationUrl : "";

        p.addText('     ' + svcName, {
            bold: true,
            verticalAlign: true,
            font_size: 18
        });
        p.addLineBreak();
        p.addText('________________________________________________________________________', {
            color: '808080'
        });
        p.addLineBreak();
        p.addText(service.entity.description, {
            font_size: 16
        });
        p.addLineBreak();
        p.addText('Author:  ' + author, {
            font_size: 14,
            color: '808080'
        });
        p.addLineBreak();
        p.addText('Documentation:  ', {
            font_size: 14,
            color: '808080'
        });
        p.addLineBreak();
        p.addText(doc, {
            font_size: 14,
            color: '808080'
        });
        p.addLineBreak();
    });

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "inline; filename=catalog-" + genDate + ".docx");
    docx.generate(res);
}

module.exports = router;