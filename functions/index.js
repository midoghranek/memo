// Modules
const app = require("express")();
const functions = require("firebase-functions");

// import functions
const { getAllMemes, postOneMeme } = require("./handlers/memes");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/users");
const FBAuth = require("./util/fbauth");

// memes routes
app.get("/memes", getAllMemes);
app.post("/meme", FBAuth, postOneMeme);

// Users route
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);

// export firebase function api
exports.api = functions.region("europe-west1").https.onRequest(app);
