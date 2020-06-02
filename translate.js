const {Translate} = require('@google-cloud/translate').v2;
const targets = require('./targets.js');

const translate = new Translate();

const text = 'FALSE';

async function translateText(text, target) {
  let [translations] = await translate.translate(text, target.code);
  translations = Array.isArray(translations) ? translations : [translations];
  translations.forEach((translation) => {
    target.out.forEach((output) => {
      console.log(`(${output}) => "${translation}"`);
    });
  });
}

console.log(`Translations of "${text}":`);
targets.forEach((target, i) => {
  translateText(text, target)
});
