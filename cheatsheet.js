function CheatSheet() {
  const self = this;
  const fs = require('fs');
  const PDFDocument = require('pdfkit');
  const moment = require('moment');
  const catalogCategories = [
    {
      id: 'compute',
      label: 'Compute',
      tags: ['compute', 'openwhisk', 'containers'],
    },
    {
      id: 'network',
      label: 'Networking',
      tags: ['network', 'softlayer'],
    },
    {
      id: 'storage',
      label: 'Storage',
      tags: ['storage'],
    },
    {
      id: 'ai',
      label: 'AI',
      tags: ['ai', 'watson'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      tags: ['analytics', 'business_analytics', 'big_data', 'data_management'],
    },
    {
      id: 'databases',
      label: 'Databases',
      tags: ['databases', 'database', 'cldamqp', 'esql',],
    },
    {
      id: 'devops',
      label: 'Developer Tools',
      tags: ['devops', 'dev_ops'],
    },
    {
      id: 'integration',
      label: 'Integration',
      tags: ['integration'],
    },
    {
      id: 'iot',
      label: 'Internet of Things',
      tags: ['iot', 'internet_of_things'],
    },
    {
      id: 'security',
      label: 'Security and Identity',
      tags: ['security'],
    },
    {
      id: 'mobile',
      label: 'Web And Mobile',
      tags: ['mobile'],
    },
    {
      id: 'app_services',
      label: 'Web and Application',
      tags: ['app_services', 'web_and_app'],
    },
    {
      id: 'finance',
      label: 'Finance',
      tags: ['finance']
    },
    {
      id: 'blockchain',
      label: 'Blockchain',
      tags: ['blockchain']
    },
    {
      id: 'vmware',
      label: 'VMware',
      tags: ['vmware']
    }
  ];

  self.generate = function () {
    const resources = JSON.parse(fs.readFileSync('public/generated/resources-full.json', 'utf8'))
      .filter(resource =>
        resource.tags.indexOf('ibm_deprecated') < 0 &&
        resource.tags.indexOf('ibm_experimental') < 0)
      //  &&
      // resource.tags.indexOf('ibm_created')>=0)
      .sort((resource1, resource2) => resource1.displayName.localeCompare(resource2.displayName));

    sheet = new PDFDocument({
      autoFirstPage: false,
      size: 'A4' // 595.28 x 841.89
    });

    sheet.registerFont('Plex Sans',
      'node_modules/@ibm/plex/IBM-Plex-Sans/fonts/complete/ttf/IBMPlexSans-Regular.ttf');
    sheet.registerFont('Plex Sans Bold',
      'node_modules/@ibm/plex/IBM-Plex-Sans/fonts/complete/ttf/IBMPlexSans-Bold.ttf');

    const margin = 20;

    const pageWidth = 850;
    const pageHeight = 600;
    const columnCount = 4;
    const columnWidth = (pageWidth - 2 * margin) / columnCount;
    const lineHeight = ((pageHeight - 2 * margin) * columnCount - 2 * columnWidth) / (catalogCategories.length + resources.length);
    const fontSize = lineHeight - 2;

    console.log('Column width', columnWidth);
    console.log('Font size', fontSize);

    sheet.pipe(fs.createWriteStream('public/generated/cheatsheet.pdf'));

    sheet
      .font('Plex Sans')
      .fontSize(fontSize);
    sheet.addPage({
      margin: 0,
      layout: 'landscape',
      size: 'A4',
    });

    sheet.image('public/icons/ibmcloud_logo.png', margin, margin,
      { fit: [columnWidth - margin, columnWidth] });
    const date = new Date();
    var dateMDY = moment(date).format('MMMM DD, YYYY');
    sheet.text(`Last updated on ${dateMDY}\nhttps://ibm.biz/cloud-cheatsheet`, 0, 140, {
      width: columnWidth,
      align: 'center',
    });

    let currentX = margin;
    let currentY = margin;

    function nextLine(lineSize = fontSize) {
      currentY = currentY + lineSize;
      if (currentY >= (pageHeight - 3 * margin)) {
        currentY = margin;
        currentX = currentX + columnWidth;
      }
    }

    // start after the logo
    currentY = 160; //columnWidth;

    const styling = {
      category: {
        color: '#3f6faf',
        background: '#e4effa',
      },
      resource: {
        color: '#000',
        background: '',
      }
    };

    let alreadySeen = [];

    catalogCategories.forEach((category) => {
      console.log('>>> Processing category', category.label);
      // add a category

      const resourcesInCategory = resources.filter(resource =>
        (resource.tags.filter(tag => category.tags.indexOf(tag) >= 0).length > 0 ||
          category.tags.indexOf(resource.name) >= 0) &&
        alreadySeen.indexOf(resource.id) < 0);
      alreadySeen = alreadySeen.concat(resourcesInCategory.map(resource => resource.id));

      if (resourcesInCategory.length == 0) {
        return;
      }

      nextLine(lineHeight);
      sheet
        .lineCap('round')
        .lineWidth(lineHeight)
        .fillAndStroke(styling.category.color, styling.category.background)
        .moveTo(currentX, currentY + lineHeight / 2 + 1)
        .lineTo(currentX + columnWidth - margin, currentY + lineHeight / 2 + 1)
        .stroke()

      sheet
        .font('Plex Sans Bold')
        .fillColor(styling.category.color)
        .text(category.label, currentX, currentY);
      nextLine(lineHeight);

      console.log('Found', resourcesInCategory.length, 'resources in', category.label);
      resourcesInCategory.forEach((resource) => {

        // icon for the resource
        if (category.id !== 'vmware' && fs.existsSync('public/generated/icons/' + resource.id + '.png')) {
          sheet.image('public/generated/icons/' + resource.id + '.png', currentX, currentY + lineHeight / 4,
            { fit: [fontSize, fontSize] });
        }

        // resource label
        sheet
          .font('Plex Sans')
          .fillColor(styling.resource.color)
          .text(resource.displayName, currentX + fontSize + 2, currentY, {
            width: columnWidth,
            ellipsis: true,
            lineBreak: false,
          });
        nextLine(lineHeight);
      });
    });

    resources.forEach((resource) => {
      if (alreadySeen.indexOf(resource.id) < 0) {
        console.log(resource.name, 'not showing in the cheat sheet', resource.tags);
      }
    });

    console.log('Closing document');
    sheet.end();
  };
}

module.exports = function () {
  return new CheatSheet();
}