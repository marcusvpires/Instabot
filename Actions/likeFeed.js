async function likeFeed(page) {
  page.evaluate(() => {
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
      likeFeed();
      return;
    }
    query = parentButton(query);
    query.scrollIntoView({ block: "center", inline: "nearest" });
    console.log("Like post:", query);
    query.click();
  });
}

module.exports = likeFeed;
