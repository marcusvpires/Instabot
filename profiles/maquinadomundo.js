const instabot = require("../instabot");

let userName = "maquina_do_mundo";
let password = "j1fbI7N62TA00aOIDgCOJuchG";
let headless = false;
let maxLikes = 80; // Max 200 day
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
