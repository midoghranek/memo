// Modules
const app = require("express")();
const functions = require("firebase-functions");
const { db } = require("./util/admin");

// import functions
const {
  getAllMemes,
  postOneMeme,
  getOneMeme,
  CommentOnMeme,
  likeMeme,
  unlikeMeme,
  deleteMeme
} = require("./handlers/memes");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
} = require("./handlers/users");
const FBAuth = require("./util/fbauth");

// memes routes
app.get("/memes", getAllMemes);
app.post("/meme", FBAuth, postOneMeme);
app.get("/meme/:memeId", getOneMeme);
app.delete("/meme/:memeId", FBAuth, deleteMeme);
app.get("/meme/:memeId/like", FBAuth, likeMeme);
app.get("/meme/:memeId/unlike", FBAuth, unlikeMeme);
app.post("/meme/:memeId/comment", FBAuth, CommentOnMeme);

// Users route
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

// export firebase function api
exports.api = functions.region("europe-west1").https.onRequest(app);

// Notification on like
exports.createNotificationOnlike = functions
  .region("europe-west1")
  .firestore.document("memes/{memeId}/likes/{likeId}")
  .onCreate((snapshot, context) => {
    const memeId = context.params.memeId;
    return db
      .doc(`/memes/${memeId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db
            .doc(`/users/${doc.data().userHandle}/notifications/${snapshot.id}`)
            .set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              read: false,
              memeId: doc.id,
              type: "like",
              commentBody: "",
              senderImage: snapshot.data().userImage
            });
        } else {
          return console.error("Meme not found");
        }
      })
      .catch(err => {
        console.error(err);
      });
  });

// Delete Notification on unlike
exports.deleteNotificationOnunlike = functions
  .region("europe-west1")
  .firestore.document("memes/{memeId}/likes/{likeId}")
  .onDelete((snapshot, context) => {
    const memeId = context.params.memeId;
    return db
      .doc(`/memes/${memeId}`)
      .get()
      .then(doc => {
        return db
          .doc(`/users/${doc.data().userHandle}/notifications/${snapshot.id}`)
          .delete();
      })
      .catch(err => {
        console.error(err);
      });
  });

// Notification on comment
exports.createNotificationOncomment = functions
  .region("europe-west1")
  .firestore.document("memes/{memeId}/comments/{commentId}")
  .onCreate((snapshot, context) => {
    const memeId = context.params.memeId;
    return db
      .doc(`/memes/${memeId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db
            .doc(`/users/${doc.data().userHandle}/notifications/${snapshot.id}`)
            .set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              read: false,
              memeId: doc.id,
              type: "comment",
              commentBody: snapshot.data().body,
              senderImage: snapshot.data().userImage
            });
        } else {
          return console.error("Meme not found");
        }
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

// Delete Notification on comment delete
exports.deleteNotificationOnCommentDelete = functions
  .region("europe-west1")
  .firestore.document("memes/{memeId}/comments/{commentId}")
  .onDelete((snapshot, context) => {
    const memeId = context.params.memeId;
    return db
      .doc(`/memes/${memeId}`)
      .get()
      .then(doc => {
        return db
          .doc(`/users/${doc.data().userHandle}/notifications/${snapshot.id}`)
          .delete();
      })
      .catch(err => {
        console.error(err);
      });
  });

// exports.onUserImageChange = functions.region('europe-west1').firestore
