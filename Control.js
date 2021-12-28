const puppeteer = require("puppeteer");
const fs = require("fs").promises;

async function controller() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await login(page);

  await delay(2);

  await scrapProfileLinks(page);
  // await browser.close();
  console.log("-- Script end");
}

/* -------------------------------------------------------------------------- */
/*                                   Actions                                  */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- Login --------------------------------- */

async function login(page) {
  try {
    // Check previous cookies
    const cookiesString = await fs.readFile("./Storage/cookies.json");
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    await page.goto("https://www.instagram.com/");
  } catch (err) {
    console.log("Can't find cookies, start login...");
    await setCookies(page);
  }
  await page.waitForSelector("button");
  await delay(2);
  await buttonContain(page, "Agora não");
  console.info("-- Login");
}

async function setCookies(page) {
  await page.goto("https://www.instagram.com/accounts/login/");
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', "lxl3ehl53");
  await page.type('input[name="password"]', "asdf9876");
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  await page.waitForSelector("button");
  await delay(2);
  await buttonContain(page, "Agora não");
  await page.waitForNavigation();
  // Save cookies in ./Storage/cookies.json
  const cookies = await page.cookies();
  await fs.writeFile(
    "./Storage/cookies.json",
    JSON.stringify(cookies, null, 2)
  );
}

/* --------------------------- Scrap profile links -------------------------- */

async function scrapProfileLinks(page) {
  await openLikedByList(page);
  await delay(5)
  await scrapNames(page)
}

async function openLikedByList(page) {
  await page.evaluate(() => {
    function parentButton(element, maxParentsPassed = 10) {
      for (let ix = 0; ix < maxParentsPassed; ix++) {
        element = element.parentElement;
        if (element.tagName === "BUTTON") {
          return element;
        }
      }
    }
    const article = document.querySelector("article");
    article.scrollIntoView({ block: "center", inline: "nearest" });
    const flag = article.querySelector('svg[aria-label="Curtir"][width="24"]');
    // Mark article with like
    if (flag) {
      let likeButton = parentButton(flag);
      likeButton.click();
    }
    // Open likers list
    let likeProfileList = article.querySelector('a[href*="liked_by"]');
    if (likeProfileList) {
      likeProfileList.click();
    }
    // Remove article from this section
    article.remove();
  });
}

async function scrapNames(page) {
  let names = []
  let counter = 0
  while (true) {
    if (counter > 10) {
      console.log(`-- Scrap loop limit <Total ${names.length}>`)
      break
    }
    console.log('   Counter:', counter)
    const profileNames = await page.evaluate(() => {
      const likedBySection = document.querySelector('div[aria-label="Curtidas"]');
      const profiles = likedBySection.querySelectorAll("span > a");
      const profileNames = Object.values(profiles).map((element) => {
        const name = element.attributes.title;
        element.scrollIntoView({ block: "center", inline: "nearest" });
        element.remove();
        return name;
      });
      return profileNames
    });
    names.push(...profileNames)
    if (profileNames.length > 0) {
      console.log(`-- Scrap ${profileNames.length} new profiles <Total ${names.length}>`)
    }
    else {
      console.log(`-- Scrap all profiles <Total ${names.length}>`)
      break;
    }
    counter++
    await delay(4)
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Assets                                   */
/* -------------------------------------------------------------------------- */

function delay(time) {
  console.log('   delay:', (Number(time) * 1000) + 'ms')
  return new Promise(function (resolve) {
    setTimeout(resolve, (Number(time) * 1000));
  });
}

async function buttonContain(page, innerText) {
  const [button] = await page.$x(`//button[contains(., '${innerText}')]`);
  if (button) {
    await button.click();
  } else {
    console.info("Button (" + innerText + ") not found");
  }
}

controller();
