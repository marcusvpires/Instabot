const delay = require("../Assets/delay");

async function likeFeed(page) {
  const response = await page.evaluate(() => {
    function parentButton(element, maxParentsPassed = 10) {
      for (let ix = 0; ix < maxParentsPassed; ix++) {
        element = element.parentElement;
        if (element.tagName === "BUTTON") {
          return element;
        }
      }
    }
    let query = document.querySelector('svg[aria-label="Curtir"][width="24"]');
    if (!query) {
      window.scrollTo(0, document.body.scrollHeight);
      return { message: "Like button does not found" };
    }
    let likeButton = parentButton(query);
    likeButton.scrollIntoView({ block: "center", inline: "nearest" });
    likeButton.click();
    return { message: "-- Like feed", likeButton: likeButton };
  });
  if (response.likeButton) {
    return response.likeButton;
  }
  delay(4000);
}

module.exports = likeFeed;
