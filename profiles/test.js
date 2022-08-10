const instabot = require("../instabot");

let userName = "czdvbu3ac";
let password = "asdf9876";
let headless = false;
let maxLikes = 100; // Max 200 day
let minProfiles = 50;
let delayNextProfile = 10;
let delayNextPost = 5;

instabot(
  userName,
  password,
  headless,
  maxLikes,
  minProfiles,
  delayNextProfile,
  delayNextPost
);
