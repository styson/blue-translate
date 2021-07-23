const { Translate } = require('@google-cloud/translate').v2;
// const targets = require('./targets.js');
const targets = [
  { code:'es',name:'Spanish',out:['es','es-ES'] },
]

const translate = new Translate();

const text = "{0} does not support the \"{1}\" operator. The supported operators are {2}.";

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
targets.forEach((target) => {
  translateText(text, target)
});
