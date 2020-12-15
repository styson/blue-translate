const fs = require('fs');
const mkdirp = require('mkdirp')
const neatCsv = require('neat-csv'); // https://github.com/sindresorhus/neat-csv
const fastCsv = require('fast-csv'); // https://c2fo.io/fast-csv/

let masterKeys = []
let strArray = [];

// const targets = require('./targets.js');
const targets = [
  { code:'no',name:'Norwegian',out:['nb-NO'] }
]

async function writeFile(strArray, output, inputFile) {
  const dir = `./results/${output}`;
  mkdirp.sync(dir);

  const outputFile = `${dir}/${inputFile}`;
  return new Promise(resolve => {
    const ws = fs.createWriteStream(outputFile);
    fastCsv
      .write(strArray, { headers: false, quoteColumns: true })
      .pipe(ws);
    ws.on('finish', () => ws.close(resolve))
  });
}

async function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

async function process(data, loc) {
  const keys = await neatCsv(data);

  // let strArray = [];
  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    // console.log(key)
    const obj = {
      Key: key.Key,
      en: key.en
    }

    if(masterKeys.indexOf(key.Key) < 0) {
      masterKeys.push(key.Key)
      obj[loc] = key[loc]
      strArray.push(obj)
    }
  }

  // console.log(strArray)
}

async function main() {


  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    for (let j = 0; j < target.out.length; j++) {

      masterKeys = []
      strArray = [];

      const loc = target.out[j];

      const obj = {
        Key: 'Key',
        en: 'en'
      }
      obj[loc] = loc;
      strArray.push(obj);

      const inputFile = `19.1.Console.${loc}.csv`;
      // const inputFile = `19.1.Console.BatchActions.${loc}.csv`;

      const inputFolder = `C:\\Users\\styso\\Downloads\\june22\\${loc}\\`;
      const file = `${inputFolder}${inputFile}`;
      let data = await readFile(file);
      await process(data, loc);

      const blueFolder = `C:\\projects\\blue\\source\\i18n\\Data\\${loc}\\`;
      const blueFile = `${blueFolder}${inputFile}`;
      data = await readFile(blueFile);
      await process(data, loc);

      await writeFile(strArray, loc, inputFile);
    }
  }
}

main();
