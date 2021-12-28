const puppeteer = require("puppeteer");
const delay = require("./Assets/delay")
const login = require("./Actions/login")

async function controller() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await login(page)

  console.log("Script finished");
  await delay(4000);
  await browser.close();
}

controller()
