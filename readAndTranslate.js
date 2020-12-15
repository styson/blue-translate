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
  // { code:'sk',name:'Slovak',out:['sk-SK'] },
  // { code:'th',name:'Thai',out:['th-TH'] },
  // { code:'tr',name:'Turkish',out:['tr'] },
  // { code:'vi',name:'Vietnamese',out:['vi-VN'] },
  // { code:'zh-CN',name:'Chinese (Simplified)',out:['zh-CHS'] },
  // { code:'zh-TW',name:'Chinese (Traditional)',out:['zh-CHT'] }
  // { code:'es',name:'Spanish',out:['es','es-ES'] },
  // { code:'de',name:'German',out:['de'] },
// ]

// const inputFolder = 'C:\\';
// const inputFile = 'froala.en.csv';
// const inputFile = '18.5.Frontend_PortalSettings.en.csv';
// const inputFile = '18.5.Core.PortalSettings.en.csv';
// const inputFile = '19.0.Facet_Validation.en.csv';
// const inputFile = '19.0.MissingKeys.en.csv';

// const inputFile = '19.1.AlternateId.en.csv';
// const inputFile = '19.1.AssignWithoutOwnership.en.csv';
// const inputFile = '18.5.ESP_Button_Tooltips.en.csv';

const inputFolder = 'C:\\projects\\blue\\agent\\source\\i18n\\Data\\en\\';
// const inputFile = '19.1.Console.BatchActions.en.csv';
// const inputFile = '19.1.Console.en.csv';
// const inputFile = '19.1.Fax.en.csv';
// const inputFile = '19.2.CaseFilters.en.csv';
// const inputFile = '1013.EntityQueries.en.csv';
// const inputFile = '19.1.PurgeActions.en.csv';
// const inputFile = '19.2.Queries.en.csv';
// const inputFile = '19.2.CountryFilters.en.csv';
// const inputFile = '19.2.FAValidation.en.csv';
// const inputFile = '18.5.Core.PortalSettings.en.csv';
// const inputFile = '20.0.MissingKeys.en.csv';
// const inputFile = '20.0.Variables.en.csv';
// const inputFile = '19.2.ApiPermission.en.csv';
// const inputFile = '20.0.interaction_list_values.en.csv';
// const inputFile = '20.0.ApiPermission.en.csv';
// const inputFile = '20.0.ApiValidation.en.csv';
// const inputFile = '20.PortalFilters.en.csv';
// const inputFile = '1001.Frontend_PortalLinks.csv';
// const inputFile = '20.0.Frontend_PortalLinks.csv';
// const inputFile = '20.0.Core.PortalConfigs.csv';
const inputFile = '20.1.0.PortalFilters.csv';

const file = `${inputFolder}${inputFile}`;

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
  const data = await readFile();
  await process(data);
  pool.end();
}

main();
