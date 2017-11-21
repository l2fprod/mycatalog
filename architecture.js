const fs = require('fs');
const pptx = require('pptxgenjs');

// load the services
const resources = JSON.parse(fs.readFileSync('public/generated/resources-full.json', 'utf8'));

// global properties for the deck
pptx.setLayout('LAYOUT_16x9');

let slide = pptx.addNewSlide();
slide.bkgd = 'FFFFFF';

let column = 0;
let line = 0;

const configuration = {
  box: {
    width: 1,
    height: 1.2,
  },
  circleSize: 0.5,
  iconSize: 0.3,
  font: {
    size: 6,
    face: 'Helvetica',
  },
  columnsPerSlide: 9,
  linesPerSlide: 4,
}

// the diagram template slide
const diagramConfiguration = {
  font: {
    size: 9,
    face: 'Helvetica',
  },
  numbers: {
    size: 0.20,
    font: {
      size: 7,
      face: 'Helvetica',
    },
  }
};

slide.addText('USER', {
  x: 0.6,
  y: 0.5,
  w: 0.4,
  font_size: diagramConfiguration.font.size,
  font_face: diagramConfiguration.font.face,
  autoFit: true,
  margin: 0,
  color: '646365',
  bold: true,
});

slide.addShape(pptx.shapes.LINE, {
  x: 2.3,
  y: 0.5,
  w: 0.01,
  h: 4.5,
  line: '646365',
  line_size: 1.5,
});

slide.addText('EXTERNAL', {
  x: 2.7,
  y: 0.5,
  w: 0.75,
  font_size: diagramConfiguration.font.size,
  font_face: diagramConfiguration.font.face,
  autoFit: true,
  margin: 0,
  color: '646365',
  bold: true,
});

slide.addShape(pptx.shapes.LINE, {
  x: 5.3,
  y: 0.5,
  w: 0.01,
  h: 4.5,
  line: '646365',
  line_size: 1.5,
});

slide.addText('CLOUD', {
  x: 5.7,
  y: 0.5,
  w: 0.75,
  font_size: diagramConfiguration.font.size,
  font_face: diagramConfiguration.font.face,
  autoFit: true,
  margin: 0,
  color: '646365',
  bold: true,
}); 

slide.addShape(pptx.shapes.LINE, {
  x: 6,
  y: 2.3,
  w: 2,
  h: 0,
  line: '646365',
  line_size: 1.5,
  line_tail: 'arrow',
});

// to number steps
for (let number = 0; number < 15; number++) {
  slide.addShape(pptx.shapes.OVAL, {
    x: 0.3,
    y: 1 + (diagramConfiguration.numbers.size + 0.1) * number,
    w: diagramConfiguration.numbers.size,
    h: diagramConfiguration.numbers.size,
    fill: { type:'solid', color:'FFFFFF' },
    line: '0C755F',
    line_size: 1.5,
  });
  slide.addText(`${number + 1}`, {
    x: 0.3,
    y: 1 + (diagramConfiguration.numbers.size + 0.1) * number,    
    w: diagramConfiguration.numbers.size,
    h: diagramConfiguration.numbers.size,
    font_size: diagramConfiguration.numbers.font.size,
    font_face: diagramConfiguration.numbers.font.face,
    align: 'center',
    valign: 'middle',
    autoFit: true,
    margin: 0,
    color: '0C755F',
    bold: true,
  });
}

// the icons
slide = pptx.addNewSlide();
slide.bkgd = 'FFFFFF';

const iconOffset = (configuration.circleSize - configuration.iconSize) / 2;

console.log(`${resources.length} resources to generate`);
resources.forEach(resources => {
  // the circle
  slide.addShape(pptx.shapes.OVAL, {
    x: 0.3 + column * configuration.box.width,
    y: 0.3 + line * configuration.box.height,
    w: configuration.circleSize,
    h: configuration.circleSize,
    fill: { type:'solid', color:'FFFFFF' },
    line: '646365',
    line_size: 1.5,
  });

  let iconFilename = `public/generated/icons/${resources.id}.png`;
  if (!fs.existsSync(iconFilename)) {
    iconFilename = `public/generated/icons/${resources.id}.svg`;
  }

  // the icon
  slide.addImage({
    path: iconFilename,
    x: 0.3 + column * configuration.box.width + iconOffset,
    y: 0.3 + line * configuration.box.height + iconOffset,
    w: configuration.iconSize,
    h: configuration.iconSize,    
  });

  // the resource name
  slide.addText(resources.displayName.toUpperCase(), {
    x: 0.3 + column * configuration.box.width - 0.1,
    y: 0.3 + line * configuration.box.height + configuration.circleSize + 0.05,
    font_size: configuration.font.size,
    font_face: configuration.font.face,
    w: configuration.circleSize + 0.2,
    align: 'center',
    valign: 'top',
    autoFit: true,
    margin: 0,
    color: '646365',
    bold: true,
  });

  column = column + 1;

  if (column >= configuration.columnsPerSlide) {
    column = 0;
    line = line + 1;
    console.log('Adding a new line');
  }

  if (line >= configuration.linesPerSlide) {
    slide = pptx.addNewSlide();
    slide.bkgd = 'FFFFFF';    
    column = 0;
    line = 0;
    console.log('Adding a new slide');
  }
});

pptx.save('mycatalog-architecture-diagram-template');