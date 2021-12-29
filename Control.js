const puppeteer = require("puppeteer");
const fs = require("fs").promises;

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */

const userName = "lxl3ehl53";
const password = "asdf9876";
const minProfiles = 150;
const maxLikes = 150
let likeCounter = 0

/* -------------------------------------------------------------------------- */
/*                                   Control                                  */
/* -------------------------------------------------------------------------- */

async function control() {
  try {
    log.header();
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await openInstagram(page);
    await scrapProfiles(page);
    await likeProfiles(page);
  } catch (err) {
    console.group('\x1b[31m' + err.message + '\x1b[0m')
    console.log(err)
    console.groupEnd()
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Actions                                  */
/* -------------------------------------------------------------------------- */

/* ----------------------------- Open Instagram ----------------------------- */

async function openInstagram(page) {
  log.title("Open instagram");
  try {
    log.info("Check cookies saved in <cookies.json>");
    const cookiesString = await fs.readFile("./Storage/cookies.json");
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    await page.goto("https://www.instagram.com/");
    log.info("Cookies reset in this session");
  } catch (err) {
    log.info("Cookies not found");
    await login(page);
  }
  await page.waitForSelector("button");
  await delay(2);
  await buttonContain(page, "Agora não");
  log.info("Close notification popup");
}

async function login(page) {
  log.info(`Starting login --user: <${userName}>`);
  await page.goto("https://www.instagram.com/accounts/login/");
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', userName);
  await page.type('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  await page.waitForSelector("button");
  await delay(1);
  await buttonContain(page, "Agora não");
  log.info("Close notification popup");
  await page.waitForNavigation();
  console.log("  Save cookies in (./Storage/cookies.json)");
  const cookies = await page.cookies();
  await fs.writeFile(
    "./Storage/cookies.json",
    JSON.stringify(cookies, null, 2)
  );
  log.info("Save cookies saved in <cookies.json>");
}

/* ----------------------------- Scrap profiles ----------------------------- */

async function scrapProfiles(page) {
  let profiles = [];
  if (minProfiles <= 0) return [];
  for (let index = 0; index < 10; index++) {
    profiles.push(...(await scrapArticleProfiles(page)));
    log.info(`Total: ${profiles.length}`);
    if (profiles.length < minProfiles) {
      log.info(`Restart scrap profiles`);
    } else break;
  }
  await fs.writeFile(
    "./Storage/profiles.json",
    JSON.stringify(profiles, null, 2)
  );
  log.info(`Store profile names in <profiles.json>`);
}

async function scrapArticleProfiles(page) {
  log.title("Scrap profile names");
  await page.evaluate(openProfileList);
  log.info("Open list of profiles that like the post");
  await delay(5);
  const profileNames = await scrapNames(page);
  return profileNames;
}

async function openProfileList() {
  const article = document.querySelector("article");
  article.scrollIntoView({ block: "center", inline: "nearest" });
  let button = article.querySelector('svg[aria-label="Curtir"][width="24"]');
  if (button) {
    for (let index = 0; index < 10; index++) {
      button = button.parentElement;
      if (button.tagName === "BUTTON") break;
    }
    button.click();
  }
  const listButton = article.querySelector('a[href*="liked_by"]');
  if (listButton) listButton.click();
  article.remove();
}

async function scrapNames(page) {
  let profiles = [];
  for (let index = 0; index < 15; index++) {
    const sectionProfiles = await page.evaluate(scrapSectionNames);
    profiles.push(...sectionProfiles);
    log.info(
      `Section: ${profiles.length} -- ${sectionProfiles.length} new saved profile names`
    );
    if (sectionProfiles.length <= 0) break;
    await delay(4);
  }
  return profiles;
}

function scrapSectionNames() {
  const likedBySection = document.querySelector('div[aria-label="Curtidas"]');
  if (!likedBySection) return [];
  const profiles = likedBySection.querySelectorAll("span > a");
  return Object.values(profiles).map((element) => {
    const name = element.attributes.title.value;
    element.scrollIntoView({ block: "center", inline: "nearest" });
    element.remove();
    return name;
  });
}

/* ------------------------------ Like profiles ----------------------------- */

async function likeProfiles(page) {
  let profiles = await fs.readFile("./Storage/profiles.json");
  profiles = JSON.parse(profiles);
  for (var index = 0; index < profiles.length; index++) {
    log.title(`Like profile ${index} <${profiles[index]}>`);
    await page.goto("https://www.instagram.com/" + profiles[index]);
    await delay(5);
    await likeProfile(page);
    if (likeCounter >= maxLikes) {
      console.title(`Maximum number of likes reached <${likeCounter}/${maxLikes}>`)
      return
    }
  }
}

async function likeProfile(page) {
  const [posts, followers] = await page.evaluate(scrapPosts);
  log.info(`Number of profile followers: ${followers}`);
  log.info(`Number of profile photo links collected: ${posts.length}`);
  if (followers && Number(followers.title) < 300) return;
  for (var index = 0; index < posts.length; index++) {
    await page.goto(posts[index]);
    await delay(4);
    let liked = await page.evaluate(likePost);
    if (liked) {
      likeCounter++; 
      log.info(`C:${likeCounter} - Post liked: ${posts[index]}`);
      if (likeCounter >= maxLikes) return
    }
    await delay(4);
  }
}

function likePost() {
  let button = document.querySelector(
    'svg[aria-label="Curtir"][width="24"]'
  );
  if (!button) return;
  for (let index = 0; index < 10; index++) {
    button = button.parentElement;
    if (button.tagName === "BUTTON") break;
  }
  button.click();
  return true
}

function scrapPosts() {
  try {
    let followers = document.querySelector('a[href*="followers"] > span').title;
    const article = document.querySelector("article > div");
    let posts = article.querySelectorAll("a");
    posts = Object.values(posts).map((post) => post.href);
    if (posts.length > 7) posts.length = 7;
    return [posts, followers];
  } catch (err) {
    return [[], 0]
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Assets                                   */
/* -------------------------------------------------------------------------- */

function delay(time) {
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

const log = {
  header: () => {
    console.clear();
    console.log(`
|============================================================|
|                          Instabot                          |
|============================================================|
    `);
  },
  title: (txt) => {
    console.log("\n\x1b[32m| " + txt + "\x1b[0m");
  },
  info: (txt) => {
    console.log("| " + txt);
  },
};

control(5)
