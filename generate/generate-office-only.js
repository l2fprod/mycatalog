const fs = require('fs');

async function main() {
  const resources = JSON.parse(fs.readFileSync('../docs/generated/resources.json'));
  
  // generate the PPT, XLS, WORD
  const office = require('./export2office.js');
  await office.generate('xlsx', '../docs/generated/mycatalog.xlsx');
  // await office.generate('pptx', '../docs/generated/mycatalog.pptx');
  // await office.generate('docx', '../docs/generated/mycatalog.docx');
}

(async () => {
  await main();
})().catch(e => {
  console.log(e);
});
