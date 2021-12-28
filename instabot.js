const puppeteer = require("puppeteer");
const fs = require("fs").promises;

async function removeSaveInfoPopup(page) {
  const [button] = await page.$x("//button[contains(., 'Agora não')]");
  if (button) {
    await button.click();
  }
}

async function likeFeed() {
  let button = document.querySelector('svg[aria-label="Curtir"][width="24"]');
  if (!button) {
    window.scrollTo(0, document.body.scrollHeight);
    likeFeed();
    return;
  }
  for (let ix = 0; ix < 10; ix++) {
    button = button.parentElement;
    if (button.tagName === "BUTTON") {
      break;
    }
  }
  button.scrollIntoView({ block: "center", inline: "nearest" });
  console.log("Like post:", button);
  button.click();
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}



(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const cookiesString = await fs.readFile("./cookies.json");
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    await page.goto("https://www.instagram.com/");
  } catch (err) { 
    console.log("Can't find cookies, start login...");
    login(page);
    await page.waitForNavigation();

    await delay(8000);
    await removeSaveInfoPopup(page);
  }

  await delay(8000);
  await removeSaveInfoPopup(page);

  await delay(4000);
  await page.evaluate(likeFeed);
  await delay(4000);
  await page.evaluate(likeFeed);
  await delay(4000);
  await page.evaluate(likeFeed);
  await delay(4000);
  await page.evaluate(likeFeed);
  await delay(4000);
  await page.evaluate(likeFeed);

  console.log("Script finished");
  //await browser.close();
})();
