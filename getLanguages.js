const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate();
const target = 'en';

async function listLanguagesWithTarget() {
  // Lists available translation language with their names in a target language
  const [languages] = await translate.getLanguages(target);

  console.log('Languages:');
  languages.forEach(language => console.log(language));
}

listLanguagesWithTarget();
