var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var moment = require('moment');

var services = JSON.parse(fs.readFileSync('public/generated/services.json', 'utf8'));
var officegen = require('officegen');

// Get the date of the office export
var date = new Date();
var dateYMD = moment(date).format('YYYY-MM-DD');
var dateMDY = moment(date).format('MMMM DD, YYYY');

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
        sheet.data[0][4] = "Status";
        sheet.data[0][5] = "Free Plan";
        //sheet.data[0][5] = "Regions";
        
        sheet.data[0][6] = "Creation Date";
        sheet.data[0][7] = "Last Modification";
        sheet.data[0][8] = "Long Description";
        sheet.data[0][9] = "URL";

        // Cell Content
        sheet.data[row] = [];

        var extra = service.entity.extra;
        if (extra && extra.displayName) {
            sheet.data[row][0] = extra.displayName;
            sheet.data[row][1] = service.entity.tags[0];
            sheet.data[row][2] = service.entity.description;
            sheet.data[row][3] = extra.providerDisplayName;
            sheet.data[row][8] = extra.longDescription;
            sheet.data[row][9] = extra.documentationUrl;
        } else {
            sheet.data[row][0] = service.entity.label;
            sheet.data[row][1] = service.entity.tags[0];
            sheet.data[row][2] = service.entity.description;
            sheet.data[row][3] = service.entity.provider;
        }
        sheet.data[row][4] = ""; //TODO
        sheet.data[row][5] = ""; //TODO
        
        sheet.data[row][6] = service.metadata.created_at;
        sheet.data[row][7] = service.metadata.updated_at;

        row++;
    });

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "inline; filename=catalog-" + dateYMD + ".xlsx");
    xlsx.generate(res);
}

// ---------------------------------------------------------------------
// API Export to PPTX
// ---------------------------------------------------------------------
function exportToPowerpoint(services, res) {
    var pptx = officegen('pptx');

    pptx.setWidescreen(true);

    // Intro slide
    slide = pptx.makeNewSlide();
    slide.back = '1E3648';
    slide.addText("My Bluemix Catalog", {
        x: 150,
        y: 100,
        cx: '100%',
        font_size: 40,
        bold: true,
        color: 'ffffff'
    });
    slide.addText("Exported on " + dateMDY, {
        x: 150,
        y: 180,
        cx: '100%',
        font_size: 40,
        bold: true,
        color: 'ffffff'
    });
    slide.addText("This catalog uses the Cloudfoundry API to retrieve data from the Bluemix US catalog.", {
        x: 150,
        y: 400,
        cx: '800',
        font_size: 30,
        bold: false,
        color: '808080'
    });
    slide.addText("It tries to be as accurate as possible. Use with care.", {
        x: 150,
        y: 500,
        cx: '900',
        font_size: 30,
        bold: false,
        color: '808080'
    });
    slide.addImage(path.resolve(__dirname, 'public/icons/bluemix_logo.png'), {
        x: 1100,
        y: 30,
        cx: 90,
        cy: 100
    });


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
                cx: 90,
                cy: 100
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
                cx: '1000',
                font_size: 20,
                color: '808080'
            });

            slide.addText(extra.longDescription, {
                x: 100,
                y: 250,
                cx: '700',
                font_size: 18
            });

            slide.addShape("rect", {x: 830, y: 230, cx: 350 , cy: 300, fill: '47A9C0'});
            slide.addText("Author: ", {
                x: 850,
                y: 250,
                cx: '100%',
                font_size: 18,
                bold: false,
                color: 'ffffff'
            });
            slide.addText(extra.providerDisplayName, {
                x: 1000,
                y: 250,
                cx: '200',
                font_size: 18,
                color: 'ffffff'
            });
            slide.addText("Category: ", {
                x: 850,
                y: 300,
                cx: '100%',
                font_size: 18,
                bold: false,
                color: 'ffffff'
            });
            slide.addText(service.entity.tags[0], {
                x: 1000,
                y: 300,
                cx: '200',
                font_size: 18,
                color: 'ffffff'
            });
            slide.addText("State: ", {
                x: 850,
                y: 350,
                cx: '100%',
                font_size: 18,
                color: 'ffffff'
            });
            slide.addText("TODO", {
                x: 1000,
                y: 350,
                cx: '200',
                font_size: 18,
                color: 'ffffff'
            });
            slide.addText("Free Plan: ", {
                x: 850,
                y: 400,
                cx: '100%',
                font_size: 18,
                color: 'ffffff'
            });
            slide.addText("Yes/No", {
                x: 1000,
                y: 400,
                cx: '200',
                font_size: 18,
                color: 'ffffff'
            });
            slide.addText("Regions: ", {
                x: 850,
                y: 450,
                cx: '100%',
                font_size: 18,
                color: 'ffffff'
            });
            slide.addText("Yes/No", {
                x: 1000,
                y: 450,
                cx: '200',
                font_size: 18,
                color: 'ffffff'
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
    res.setHeader("Content-Disposition", "inline; filename=catalog-" + dateYMD + ".pptx");
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
    res.setHeader("Content-Disposition", "inline; filename=catalog-" + dateYMD + ".docx");
    docx.generate(res);
}

module.exports = router;