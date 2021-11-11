const data = require('./countries+states.js');

function hasNumbers(t) {
  var regex = /\d/g;
  return regex.test(t);
}

const useStatesWithNumbers = false;
const countries = false;

async function process(data) {
  if(!countries) {
    console.log(`"Key","en"`);
  }

  data.map((country, i) => {
    let name = country.name.replace(/[,\.\(\)]/g, '');
    name = name.replace(/[ç]/g, 'c');
    name = name.replace(/[']/g, ' ');

    if(countries) {
      console.log(`CALL AddListValueRow("Country", "${name}", 1, 0, ${i});`);
    } else {
      console.log(`"ListValue:Country-${name}","${country.name}"`);
    }

    let stateCount = 1;
    country.states.map((state) => {
      const code = state.state_code;
      if (hasNumbers(code)) {
        if (useStatesWithNumbers) {
          console.log(`CALL AddListValueRow("Country", "${name}:${state.name}", 1, 0, ${stateCount++});`)
        }
      } else {
        if(countries) {
          // console.log(`CALL AddListValueRow("Country", "${name}:${code}", 1, 0, ${stateCount++});`)
          console.log(`CALL AddStateListValueRow("StateOrProvince", "${name}", "${code}-${name}", 1, 0, ${stateCount++});`)
        } else {
          if (name == 'United States') {
            console.log(`"ListValue:StateOrProvince-${code}-${name}","${code} - ${state.name}"`);
          } else {
            console.log(`"ListValue:StateOrProvince-${code}-${name}","${state.name}"`);
          }
        }
      }
    });
  });
}

async function main() {
  await process(data);
}

main();
