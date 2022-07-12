function CheatSheet() {
  const self = this;
  const fs = require('fs');
  const PDFDocument = require('pdfkit');
  const moment = require('moment');

  const styleLightMode = {
    category: {
      color: '#3f6faf',
      background: '#e4effa',
    },
    resource: {
      color: '#000',
      background: '',
    },
    footer: {
      color: 'white',
      background: '#1d4d6c',
      fontSize: 10,
    },
    page: {
      color: '#000',
      background: '#fff',
    },
    logo: {
      icon: '../docs/icons/ibmcloud_logo.png',
      link: 'https://ibm.biz/cloud-cheatsheet',
    }
  };

  const styleDarkMode = {
    category: {
      color: '#e4effa',
      background: '#6f757a',
    },
    resource: {
      color: '#fff',
      background: '#000',
    },
    footer: {
      color: 'white',
      background: '#1d4d6c',
      fontSize: 10,
    },
    page: {
      color: '#fff',
      background: '#2c2c2d',
    },
    logo: {
      icon: '../docs/icons/ibmcloud_logo_dark.jpg',
      link: 'https://ibm.biz/cloud-cheatsheet-dark',
    }
  };

  const servicesToIgnore = [
    "exp",
    "3p-wanclds-draas-vpcplus",
    "professional-services-for-government-referral",
  ]

  self.generate = function (darkMode, outputFilename) {
    const styling = darkMode ? styleDarkMode : styleLightMode;
    const catalogCategories = JSON.parse(fs.readFileSync('../docs/js/categories.json', 'utf-8'));
    const resources = JSON.parse(fs.readFileSync('../docs/generated/resources-full.json', 'utf8'))
      .filter(resource =>
        resource.tags.indexOf('ibm_deprecated') < 0 &&
        resource.tags.indexOf('ibm_experimental') < 0 &&
        // if the service does not show in the catalog, do not put it in the cheatsheet
        !(resource.metadata.ui && resource.metadata.ui.hidden == true) &&
        servicesToIgnore.indexOf(resource.name) < 0
      //  &&
      // resource.tags.indexOf('ibm_created')>=0)
      ).sort((resource1, resource2) => resource1.displayName.localeCompare(resource2.displayName));
    console.log(`Found ${resources.length} services`);

    sheet = new PDFDocument({
      autoFirstPage: false,
      size: 'A4', // 595.28 x 841.89,
      info: {
        Title: 'IBM Cloud Catalog',
        Author: 'https://mycatalog.weworkinthecloud.com',
      }
    });

    sheet.registerFont('Plex Sans',
      './fonts/IBMPlexSans-Regular.woff');
    sheet.registerFont('Plex Sans Bold',
      './fonts/IBMPlexSans-Bold.woff');

    const margin = 20;

    const pageWidth = 850;
    const pageHeight = 600;
    const columnCount = 4;
    const columnWidth = (pageWidth - 2 * margin) / columnCount;
    const totalPageHeight = (columnCount - 1) * (pageHeight - 2 * margin) + pageHeight - columnWidth - 2 * margin;
    const lineHeight = totalPageHeight / (3 * catalogCategories.length + resources.length);
    const fontSize = lineHeight - 2;

    console.log('Column width', columnWidth);
    console.log('Font size', fontSize);

    sheet.pipe(fs.createWriteStream(outputFilename));

    sheet
      .font('Plex Sans')
      .fontSize(fontSize);
    sheet.addPage({
      margin: 0,
      layout: 'landscape',
      size: 'A4',
    });

    sheet.rect(0, 0, sheet.page.width, sheet.page.height);
    sheet.fill(styling.page.background);

    sheet.fill(styling.page.color);
    sheet.image(styling.logo.icon, margin, margin,
      { width: columnWidth - margin });
    const date = new Date();
    var dateMDY = moment(date).format('MMMM DD, YYYY');
    sheet
      .fontSize(fontSize)
      .text('Start building immediately using\n170+ unique services.', margin, margin + 120, {
        width: columnWidth - margin,
        align: 'center',
      });
    sheet
      .fontSize(fontSize)
      .text(`Last updated on ${dateMDY}\n${styling.logo.link}`, margin, margin + 160, {
        width: columnWidth - margin,
        align: 'center',
      });

    sheet
      .rect(0, pageHeight - 1.5 * margin, pageWidth, 1.5 * margin)
      .fill(styling.footer.background);
    sheet
      .fontSize(styling.footer.fontSize)
      .fillColor(styling.footer.color)
      .font('Plex Sans Bold')
      .text('Built for all your applications.  AI Ready.  Secure to the core.  This is the IBM Cloud.  Visit cloud.ibm.com today.', 0, pageHeight - (1.25 * margin), {
        width: pageWidth,
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
    currentY = margin + columnWidth;

    let alreadySeen = [];

    catalogCategories.forEach((category) => {
      console.log('>>> Processing category', category.label);
      // add a category

      const resourcesInCategory = resources.filter(resource =>
        (
          resource.tags.filter(tag => category.tags.indexOf(tag) >= 0).length > 0 ||
          category.tags.indexOf(resource.name) >= 0
        ) && 
          resource.tags.filter(tag => category.exclude.indexOf(tag)>=0).length == 0 &&
        alreadySeen.indexOf(resource.id) < 0);
      alreadySeen = alreadySeen.concat(resourcesInCategory.map(resource => resource.id));

      if (resourcesInCategory.length == 0) {
        return;
      }

      nextLine(lineHeight / 1.5);
      sheet
        .lineCap('round')
        .lineWidth(lineHeight)
        .fillAndStroke(styling.category.color, styling.category.background)
        .moveTo(currentX, currentY + lineHeight / 2 + 1)
        .lineTo(currentX + columnWidth - margin, currentY + lineHeight / 2 + 1)
        .stroke()

      sheet
        .fontSize(fontSize)
        .font('Plex Sans Bold')
        .fillColor(styling.category.color)
        .text(category.label, currentX, currentY);
      nextLine(lineHeight);

      console.log('Found', resourcesInCategory.length, 'resources in', category.label);
      resourcesInCategory.forEach((resource) => {

      // icon for the resource
      if (fs.existsSync('../docs/generated/icons/' + resource.id + '.png')) {
        sheet.image('../docs/generated/icons/' + resource.id + '.png', currentX, currentY + 1.5,
          { width: fontSize, height: fontSize /*fit: [fontSize, fontSize]*/ });
      }

        // resource label
        sheet
          .font('Plex Sans')
          .fillColor(styling.resource.color)
          .text(resource.displayName, currentX + fontSize + 2, currentY, {
            width: columnWidth - margin,
            ellipsis: true,
            lineBreak: false,
            height: lineHeight,
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