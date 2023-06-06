const fs = require('fs');
const neatCsv = require('neat-csv'); // https://github.com/sindresorhus/neat-csv

const inputFolder = 'C:\\projects\\blue\\agent\\source\\i18n\\Data\\en\\';
const inputFiles = ['tra-combined.csv'];
let inputFile = '';

async function readFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

async function process(data) {
  let wc = 0;
  let seen = [];
  const keys = await neatCsv(data);
  for (const key of keys) {
    const obj = {
      Key: key.Key,
      en: key.en
    }
    const xxx = key.en || '';

    if(seen.indexOf(xxx) < 0 && xxx.length > 0 && xxx !== 'en') {
      seen.push(xxx);
      console.log(xxx);
      wc = wc + xxx.trim().split(/\s+/).length;
    }
  }

  console.log(`Total Words: ${wc}`);
}

async function main() {
  for (inputFile of inputFiles) {
    file = `${inputFolder}${inputFile}`;
    const data = await readFile();
    await process(data);
  }
}

main();
