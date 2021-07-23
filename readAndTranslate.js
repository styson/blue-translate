const fs = require('fs');
const mkdirp = require('mkdirp')
const mysql = require('mysql2/promise');
const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate();
const neatCsv = require('neat-csv'); // https://github.com/sindresorhus/neat-csv
const fastCsv = require('fast-csv'); // https://c2fo.io/fast-csv/

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'sasa',
  database: 'translate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const targets = require('./targets.js');
// const targets = [
  // { code:'es',name:'Spanish',out:['es','es-ES'] },
  // { code:'de',name:'German',out:['de'] },
// ]

const inputFolder = 'C:\\projects\\blue\\agent\\source\\i18n\\Data\\en\\';
// const inputFile = '20.5.0.asset_page.en.csv';
// const inputFile = '20.5.Assets.en.csv';
// const inputFile = '20.6.ie11WarningBanner.en.csv';
// const inputFile = '20.6.ieWarning.en.csv';
const inputFiles = ['20.5.0.asset_page.en.csv', '20.5.Assets.en.csv'];

let inputFile = '';
let file = '';

async function translateText(text, target) {
  const [translation] = await translate.translate(text, target);
  return translation;
}

async function rowExists(keyword, locale) {
  try {
    const [result] = await pool.query('select translation from strings where keyword = ? and locale = ?', [keyword, locale]);
    if (result.length < 1) {
      return '';
    } else {
      return result[0].translation;
    }
  } catch (err) {
    console.error("Table query failed:", err);
  }
}

async function insertRow(keyword, locale, translation) {
  await pool.query('insert IGNORE into strings set keyword = ?, locale = ?, translation = ?',
    [ keyword, locale, translation ]
  );
}

async function writeFile(strArray, output) {
  const dir = `./results/${output}`;
  mkdirp.sync(dir);

  const outputFile = `${dir}/${inputFile.replace('.en.',`.${output}.`)}`;
  return new Promise(resolve => {
    const ws = fs.createWriteStream(outputFile);
    fastCsv
      .write(strArray, { headers: true, quoteColumns: true })
      .pipe(ws);
    ws.on('finish', () => ws.close(resolve))
  });
}

async function readFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

async function process(data) {
  const keys = await neatCsv(data);

  for(const target of targets) {
    for(const output of target.out) {
      let strArray = [];
      for(const key of keys) {
        const obj = {
          Key: key.Key,
          en: key.en
        }
        const existingTranslation = await rowExists(key.Key, output);
        if(existingTranslation > '') {
          obj[output] = existingTranslation;
          strArray.push(obj);
        } else {
          const translatedText = await translateText(key.en, target.code);
          await insertRow(key.Key, output, translatedText);
          obj[output] = translatedText;
          strArray.push(obj);
        }
      }
      await writeFile(strArray, output);
    }
  }
}

async function main() {
  for(inputFile of inputFiles) {
    file = `${inputFolder}${inputFile}`;
    const data = await readFile();
    await process(data);
  }
  pool.end();
}

main();
