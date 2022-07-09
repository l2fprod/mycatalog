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
  
  // store in the database
  if (process.env.CLOUDANT_URL) {
    const Database = require("./database.js");
    const db = await Database(process.env.CLOUDANT_URL, "snapshots");
    await db.addSnapshot(resources);
    
    // generate the latest feed
    const snapshots = await db.getRecentSnapshots();
    const feedGenerator = require('./feed.js');
    const feedAsString = feedGenerator.generateFeed(snapshots);
    fs.writeFileSync('../docs/feed.xml', feedAsString);
  }
}

(async () => {
  await main();
})().catch(e => {
  console.log(e);
});
