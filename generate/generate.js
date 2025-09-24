const fs = require('fs');

async function main() {
  // get the latest resources
  const serviceUpdater = require('./retrieve.js')();
  const resources = await serviceUpdater.run();
  // const resources = JSON.parse(fs.readFileSync('../docs/generated/resources.json'));
  
  // generate the PPT, XLS, WORD
  const office = require('./export2office.js');
  await office.generate('xlsx', '../docs/generated/mycatalog.xlsx');
  await office.generate('pptx', '../docs/generated/mycatalog.pptx');
  await office.generate('docx', '../docs/generated/mycatalog.docx');
  
  // generate the cheatsheet
  const cheatsheet = require('./cheatsheet.js')();
  cheatsheet.generate(false, '../docs/generated/cheatsheet.pdf');
  cheatsheet.generate(true, '../docs/generated/cheatsheet-dark.pdf');
  
  // generate the feed by comparing the previous snapshot with the current
  console.log('Generating feed...');
  const feedGenerator = require('./feed.js');
  const feedAsString = feedGenerator.generateFeed([
    // most recent
    {
      resources: JSON.parse(fs.readFileSync("../docs/generated/resources-full.json")),
      createdAt: new Date()
    },
    // previous
    {
      resources: JSON.parse(fs.readFileSync("../previous-resources-full.json")),
      createdAt: new Date()
    },
  ]);
  fs.writeFileSync('../docs/generated/feed.xml', feedAsString);
}

(async () => {
  await main();
})().catch(e => {
  console.log(e);
});
