const puppeteer = require("puppeteer");
const delay = require("./Assets/delay")
const login = require("./Actions/login")
const likeFeed = require("./Actions/likeFeed")

async function controller() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await login(page)
  
  await likeFeed(page)
  await delay(4000);

  // await browser.close();
  console.log("Script finished");
}

controller()
