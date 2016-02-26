var fs = require('fs');
var path = require('path');

var services = JSON.parse(fs.readFileSync('public/generated/services.json', 'utf8'));
var officegen = require('officegen');
var pptx = officegen('pptx');

pptx.setWidescreen(true);

services.forEach(function (service) {
    if (!service.entity.active) {
        return;
    }

    // New slide
    slide = pptx.makeNewSlide();

    try {
        slide.addImage(path.resolve(__dirname, 'public/generated/icons/' + service.metadata.guid + '.png'),
                       {x: 50, y: 30, cx: 70, cy:70});
        slide.addImage(path.resolve(__dirname, 'public/icons/bluemix_logo.png'),
                       {x: 1100, y: 30, cx: 70, cy:70});
    } catch (err) {}

    var extra = service.entity.extra;
    if (extra && extra.displayName) {
        slide.addText(extra.displayName,         {x: 150, y: 30,  cx: '100%', font_size: 30, bold: true });
        
        slide.addText(service.entity.description,{x: 100, y: 150, cx: '1100', font_size: 20, color: '808080'});
        
        slide.addText(extra.longDescription,     {x: 100, y: 250, cx: '1100', font_size: 20});
        
        slide.addText("Author: ",                {x: 100, y: 530, cx: '100%', font_size: 20, bold: true });
        slide.addText(extra.providerDisplayName, {x: 200, y: 530, cx: '100%', font_size: 20});
        
        slide.addText(extra.documentationUrl,    {x: 100, y: 600, cx: '100%', cy: 20, color: '0000ff'});
        
        slide.addText(slide.getPageNumber(),     {x: 1150,y: 630, cx: '100',   cy: 20, color: '808080'});
    } else {
        slide.addText(service.entity.label,      {x: 150, y: 30,  cx: '100%', font_size: 30, bold: true});
        
        slide.addText(service.entity.description,{x: 100, y: 150, cx: '100%', font_size: 20});
        
        //bug slide.addText(service.entity.provider,   {x: 100, y: 300, cx: '100%'});
    }

});

var out = fs.createWriteStream('public/generated/catalog.pptx');
pptx.generate(out);
