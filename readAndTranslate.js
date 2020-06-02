const fs = require('fs');
const mkdirp = require('mkdirp')
const mysql = require('mysql2/promise');
const {Translate} = require('@google-cloud/translate').v2;
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

// const targets = require('./targets.js');
const targets = [
  { code:'de',name:'German',out:['de'] },
  { code:'es',name:'Spanish',out:['es','es-ES'] },
  { code:'pl',name:'Polish',out:['pl-PL'] },
]

const inputFolder = 'C:\\projects\\blue\\source\\i18n\\Data\\en\\';
// const inputFile = '19.0.Facet_Validation.en.csv';
const inputFile = '1009.Console_MissingKeys.en.csv';

const file = `${inputFolder}${inputFile}`;

async function translateText(text, target) {
  let [translations] = await translate.translate(text, target.code);
  translations = Array.isArray(translations) ? translations : [translations];
  translations.forEach((translation) => {
    return translation;
  });
}

async function rowexists(keyword, locale) {
  try {
    const [result] = await pool.query('SELECT translation from strings WHERE keyword = ? AND locale = ?', [keyword, locale]);
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
  await pool.query('INSERT INTO strings SET keyword = ?, locale = ?, translation = ?',
    [ keyword, locale, translation ]
  );
}

async function translateText(text, target) {
  const [translation] = await translate.translate(text, target);
  return translation;
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

async function readfile() {
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

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    for (let j = 0; j < target.out.length; j++) {
      const output = target.out[j];
      let strArray = [];
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const obj = {
          Key: key.Key,
          en: key.en
        }
        const existingTranslation = await rowexists(key.Key, output);
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
  const data = await readfile();
  await process(data);
  pool.end();
}

main();
