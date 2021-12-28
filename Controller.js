const puppeteer = require("puppeteer");
const delay = require("./Assets/delay")
const login = require("./Actions/login")
const scrapActiveProfiles = require("./Actions/scrapActiveProfiles")

async function controller() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await login(page)
  
  await scrapActiveProfiles(page)
  await delay(4000);
  await scrapActiveProfiles(page)
  await delay(4000);
  await scrapActiveProfiles(page)
  await delay(4000);
  await scrapActiveProfiles(page)
  await delay(4000);
  await scrapActiveProfiles(page)
  await delay(4000);
  await scrapActiveProfiles(page)
  await delay(4000);

  // await browser.close();
  console.log("Script finished");
}

controller()
