const puppeteer = require("puppeteer");
const fs = require("fs").promises;

function instabot(userName, password, headless, maxLikes, minProfiles, delayNextProfile, delayNextPost) {

  /* -------------------------------------------------------------------------- */
  /*                                  Variables                                 */
  /* -------------------------------------------------------------------------- */
  
  let likeCounter = 0;
  let fileTag = userName.replace(/[\W_]/g, "");
  
  /* -------------------------------------------------------------------------- */
  /*                                   Control                                  */
  /* -------------------------------------------------------------------------- */
  
  async function control() {
    try {
      log.header();
      console.time("| Runtime");
      const browser = await puppeteer.launch({ headless: headless });
      const page = await browser.newPage();
      await openInstagram(page);
      await scrapProfiles(page);
      await likeProfiles(page);
      console.timeEnd("| Runtime");
    } catch (err) {
      console.group("\x1b[31m" + err.message + "\x1b[0m");
      console.log(err);
      console.groupEnd();
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
      const cookiesString = await fs.readFile(`./storage/${fileTag}_cookies.json`);
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
    await buttonContain(page, "Agora n??o");
    log.info("Close notification popup");
    console.timeLog("| Runtime");
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
    await buttonContain(page, "Agora n??o");
    log.info("Close notification popup");
    await page.waitForNavigation();
    console.log(`  Save cookies in (./storage/${fileTag}_cookies.json)`);
    const cookies = await page.cookies();
    await fs.writeFile(
      `./storage/${fileTag}_cookies.json`,
      JSON.stringify(cookies, null, 2)
    );
    log.info("Save cookies saved in <cookies.json>");
  }
  
  /* ----------------------------- Scrap profiles ----------------------------- */
  
  async function scrapProfiles(page) {
    let profiles = [];
    if (minProfiles <= 0) return [];
    for (let index = 0; index < 500; index++) {
      profiles.push(...(await scrapArticleProfiles(page)));
      log.info(`Total: ${profiles.length}`);
      console.timeLog("| Runtime");
      if (profiles.length < minProfiles) {
        log.info(`Restart scrap profiles`);
      } else break;
    }
    await fs.writeFile(
      `./storage/${fileTag}_profiles.json`,
      JSON.stringify(profiles, null, 2)
    );
    log.info(`Store profile names in <profiles.json>`);
  }
  
  async function scrapArticleProfiles(page) {
    try {
      log.title("Scrap profile names");
      await page.evaluate(openProfileList);
      log.info("Open list of profiles that like the post");
      await delay(5);
      const profileNames = await scrapNames(page);
      return profileNames;
    } catch (err) {
      console.log("\x1b[31m| Error while scrapping article profiles\x1b[0m");
      console.log("\x1b[31m| " + err.message + "\x1b[0m");
      console.log("\x1b[31m| Restarting instagram page\x1b[0m");
      await openInstagram(page);
      await delay(5);
      return []
    }
  }
  
  function openProfileList() {
    const article = document.querySelector("article[role='presentation']");
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
    if (button && listButton) listButton.click();
    article.attributes.role.value = "marked"
  }
  
  async function scrapNames(page) {
    let profiles = [];
    for (let index = 0; index < 4; index++) {
      const sectionProfiles = await page.evaluate(scrapSectionNames);
      profiles.push(...sectionProfiles);
      log.info(
        `Section: ${profiles.length} -- ${sectionProfiles.length} new saved profile names`
      );
      if (sectionProfiles.length <= 0) break;
      await delay(5);
    }
    await page.evaluate(closeProfileList);
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
  
  function closeProfileList() {
    const likedBySection = document.querySelector('div[aria-label="Curtidas"]');
    if (!likedBySection) return;
    var button = likedBySection.querySelector('svg[aria-label="Fechar"]');
    if (button) {
      for (let index = 0; index < 10; index++) {
        button = button.parentElement;
        if (button.tagName === "BUTTON") break;
      }
      button.click();
    }
  }
  
  /* ------------------------------ Like profiles ----------------------------- */
  
  async function likeProfiles(page) {
    let profiles = await fs.readFile(`./storage/${fileTag}_profiles.json`);
    profiles = JSON.parse(profiles);
    for (var index = 0; index < profiles.length; index++) {
      log.title(`Like profile ${index} <${profiles[index]}>`);
      await page.goto("https://www.instagram.com/" + profiles[index]);
      await delay(delayNextProfile);
      await likeProfile(page);
      if (likeCounter >= maxLikes) {
        log.title(`Maximum number of likes reached <${likeCounter}/${maxLikes}>`);
        console.timeLog("| Runtime");
        return;
      }
      console.timeLog("| Runtime");
    }
  }
  
  async function likeProfile(page) {
    const [posts, followers] = await page.evaluate(scrapPosts);
    log.info(`Number of profile followers: ${followers}`);
    log.info(`Number of profile photo links collected: ${posts.length}`);
    if (followers && Number(followers.title) < 300) return;
    for (var index = 0; index < posts.length; index++) {
      await page.goto(posts[index]);
      await delay(delayNextPost);
      let liked = await page.evaluate(likePost);
      if (liked) {
        likeCounter++;
        log.info(`C:${likeCounter} - Post liked: ${posts[index]}`);
        if (likeCounter >= maxLikes) return;
      }
      await delay(4);
    }
  }
  
  function likePost() {
    let button = document.querySelector('svg[aria-label="Curtir"][width="24"]');
    if (!button) return;
    for (let index = 0; index < 10; index++) {
      button = button.parentElement;
      if (button.tagName === "BUTTON") break;
    }
    button.click();
    return true;
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
      return [[], 0];
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
      log.info("Button (" + innerText + ") not found");
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
      console.log("\n\x1b[32m| Settings\x1b[0m")
      console.log(`| User name = ${userName}`)
      console.log(`| Password = ${password}`)
      console.log(`| Headless = ${headless}`)
      console.log(`| Max likes = ${maxLikes}`)
      console.log(`| Min profiles = ${minProfiles}`)
      console.log(`| Delay next profile = ${delayNextProfile}`)
      console.log(`| Delay next post = ${delayNextPost}`)
    },
    title: (txt) => {
      console.log("\n\x1b[32m| " + txt + "\x1b[0m");
    },
    info: (txt) => {
      console.log("| " + txt);
    },
  };
  
  control()

}

module.exports = instabot