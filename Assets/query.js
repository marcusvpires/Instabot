const puppeteer = require("puppeteer");
const delay = require("../Assets/delay")

async function findButton(page, innerText) {
  const [button] = await page.$x(`//button[contains(., '${innerText}')]`);
  if ( button ) { await button.click(); }
  else { console.info('Button (', innerText, ') not found') }
}

module.exports = findButton