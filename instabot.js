const puppeteer = require("puppeteer");

(async function login(page) {
  await page.goto("https://www.instagram.com/accounts/login/");
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', "czdvbu3ac");
  await page.type('input[name="password"]', "asdf9876");
  await page.click('button[type="submit"]');
})();
