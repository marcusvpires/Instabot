const delay = require("../Assets/delay")
const likeFeed = require("./likeFeed")

async function scrapActiveProfiles(page) {
  const likeButton = await likeFeed(page)
  delay(2000)
  console.log("like Button:",likeButton)
  const popupResponse = await openPopup(page, likeButton)
  console.log(popupResponse.message)
  if (popupResponse.open) {
    const scrapResponse = scrap(page)
    console.table(scrapResponse)
  }
}

async function openPopup(page, likeButton) {
  const response = await page.evaluate((likeButton) => {
    function parentTag(element, tag="BUTTON") {
      for (let ix = 0; ix < 10; ix++) {
        element = element.parentElement;
        if (element.tagName === tag) {
          return element;
        }
      }
    }
    let article = parentTag(likeButton, "ARTICLE")
    let link = article.querySelector('a[href*="liked_by"]')
    if (!link) { 
      return { message: 'Liked by link does not found' };
    }
    link.click()
    return { message: 'Popup opened', open: true };
  }, likeButton)
  return response
}

async function scrap(page) {
  const response = await page.evaluate(() => {
    let popup = document.querySelector("div[aria-label='Curtidas']")
    let links = []
    for (var ix=0; ix < 8; ix++) {
      var profile = popup.querySelector('A')
      if (!profile) {  console.log('Finish') }
      if (profile.hasAttribute('title')) {
        links.push(profile.href)
        profile.scrollIntoView({ block: "center", inline: "nearest" });
      }
      profile.remove()
    }
    return {
      message: "8 profile links scraped",
      links: links
    }
  });
  return response
}

module.exports = scrapActiveProfiles;
