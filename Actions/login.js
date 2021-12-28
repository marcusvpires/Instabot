const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const { button } = require('../Assets/query');
const delay = require("../Assets/delay")

async function login(page) {
  try {
    const cookiesString = await fs.readFile("./Storage/cookies.json");
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    await page.goto("https://www.instagram.com/");    
  } catch (err) { 
    console.log("Can't find cookies, start login...");
    await setCookies(page);
  }
  await page.waitForSelector("button");
  await button.contain(page, "Agora não");
  console.info("Login finished")
}

async function setCookies(page) {
  await page.goto("https://www.instagram.com/accounts/login/");
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', "czdvbu3ac");
  await page.type('input[name="password"]', "asdf9876");
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  await page.waitForSelector("button");
  await button.contain(page, "Agora não");
  await page.waitForNavigation();

  const cookies = await page.cookies(); 
  await fs.writeFile("./Storage/cookies.json", JSON.stringify(cookies, null, 2));
  
}

module.exports = login
