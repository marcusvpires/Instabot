const puppeteer = require("puppeteer");
const fs = require("fs").promises;

async function controller() {
  console.log("= Start intabot");
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await login(page);
  await delay(2);
  /*   
  for (let ix = 0; ix < 10; ix++) {
    await scrapProfileLinks(page);
    await delay(5)
    console.log("\n= Restart scrap profile links");
  } 
  */
  await likeProfiles(page);
  // await browser.close();
  console.log("\n= Script end");
}

/* -------------------------------------------------------------------------- */
/*                                   Actions                                  */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- Login --------------------------------- */

async function login(page) {
  try {
    console.log("\n- Login");
    console.log("  Check previous cookies");
    const cookiesString = await fs.readFile("./Storage/cookies.json");
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    await page.goto("https://www.instagram.com/");
    console.log("  Cookies restored");
  } catch (err) {
    console.log("  Cookies not found");
    await setCookies(page);
  }
  await page.waitForSelector("button");
  await delay(2);
  console.log("  Close notification popup");
  await buttonContain(page, "Agora não");
  console.info("\n- Login complete");
}

async function setCookies(page) {
  console.log("  Set new login");
  await page.goto("https://www.instagram.com/accounts/login/");
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', "lxl3ehl53");
  await page.type('input[name="password"]', "asdf9876");
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  await page.waitForSelector("button");
  await delay(2);
  console.log("  Close notification popup");
  await buttonContain(page, "Agora não");
  await page.waitForNavigation();
  console.log("  Save cookies in (./Storage/cookies.json)");
  const cookies = await page.cookies();
  await fs.writeFile(
    "./Storage/cookies.json",
    JSON.stringify(cookies, null, 2)
  );
}

/* --------------------------- Scrap profile links -------------------------- */

async function scrapProfileLinks(page) {
  console.log("\n- Scrap profile links");
  await openLikedByList(page);
  await delay(5);
  const profileNames = await scrapNames(page);
  console.log("\n- Storage names in (./Storage/profiles.json)");
  await fs.writeFile(
    "./Storage/profiles.json",
    JSON.stringify(profileNames, null, 2)
  );
}

async function openLikedByList(page) {
  console.log("  Open Linked_BY list");
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
  console.log("\n- Start names scrap");
  let names = [];
  let counter = 0;
  while (true) {
    if (counter > 10) {
      console.log("  Scrap loop limit <Total", names.length + ">");
      break;
    }
    const profileNames = await page.evaluate(() => {
      const likedBySection = document.querySelector(
        'div[aria-label="Curtidas"]'
      );
      if (!likedBySection) return [];
      const profiles = likedBySection.querySelectorAll("span > a");
      const profileNames = Object.values(profiles).map((element) => {
        const name = element.attributes.title.value;
        element.scrollIntoView({ block: "center", inline: "nearest" });
        element.remove();
        return name;
      });
      return profileNames;
    });
    names.push(...profileNames);
    if (profileNames.length > 0) {
      console.log("  Scrap:", profileNames.length, "|", names.length);
    } else {
      console.log("\n= Scrap all <Total", names.length + ">");
      break;
    }
    counter++;
    await delay(4);
  }
  return names;
}

/* ------------------------------ Like profiles ----------------------------- */

async function likeProfiles(page) {
  console.log("\n- Like profiles");
  const profileListString = await fs.readFile("./Storage/profiles.json");
  const profileList = JSON.parse(profileListString);
  for (var ix = 0; ix < profileList.length; ix++) {
    console.log("  Open", profileList[ix]);
    await page.goto("https://www.instagram.com/" + profileList[ix]);
    await delay(5);
    await postLikes(page);
  }
}

async function postLikes(page) {
  const links = await page.evaluate(() => {
    let followers = document.querySelector('a[href*="followers"] > span');
    if (followers && Number(followers.title) < 300) return [];
    const article = document.querySelector("article > div");
    const htmlLinks = article.querySelectorAll("a");
    const links = Object.values(htmlLinks).map((link) => link.href);
    if (links.length > 7) links.length = 7;
    return links;
  });
  console.log(links);
  for (var ix = 0; ix < links.length; ix++) {
    console.log("  - post", links[ix]);
    await page.goto(links[ix]);
    await delay(4);
    await page.evaluate(() => {
      let likeButton = document.querySelector(
        'svg[aria-label="Curtir"][width="24"]'
      );
      if (!likeButton) return;
      for (let ix = 0; ix < 10; ix++) {
        likeButton = likeButton.parentElement;
        if (likeButton.tagName === "BUTTON") {
          break;
        }
      }
      likeButton.click();
    });
    await delay(4);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Assets                                   */
/* -------------------------------------------------------------------------- */

function delay(time) {
  console.log("  oo", Number(time) * 1000 + "ms");
  return new Promise(function (resolve) {
    setTimeout(resolve, Number(time) * 1000);
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
