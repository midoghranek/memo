// Modules
const app = require("express")();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebase = require("firebase");

admin.initializeApp();
const db = admin.firestore();

const config = {
  apiKey: "AIzaSyDTRZHO0HWr15sa4VASErOxyc2bZu1rEuw",
  authDomain: "memo-71030.firebaseapp.com",
  databaseURL: "https://memo-71030.firebaseio.com",
  projectId: "memo-71030",
  storageBucket: "memo-71030.appspot.com",
  messagingSenderId: "463945482697"
};
firebase.initializeApp(config);

// Get memes function
app.get("/memes", (req, res) => {
  db.collection("memes")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let memes = [];
      data.forEach(doc => {
        memes.push({
          memeId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(memes);
    })
    .catch(err => console.error(err));
});

// Create meme function
app.post("/meme", (req, res) => {
  const newMeme = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };
  db.collection("memes")
    .add(newMeme)
    .then(doc => {
      return res.json({ message: `Document ${doc.id} created succussfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
});

const isEmail = email => {
  // eslint-disable-next-line
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = String => {
  if (String.trim() === "") return true;
  else return false;
};

// Signup route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(newUser.password)) errors.password = "Must not be empty";
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = "Passwords must match";
  if (isEmpty(newUser.handle)) errors.handle = "Must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "This handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(gettoken => {
      token = gettoken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
  return console.log("signup");
});

app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  let errors = {};
  if (isEmpty(user.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(user.email)) {
    errors.email = "Must be a valid email address";
  }
  if (isEmpty(user.password)) errors.password = "Must not be empty";
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        return res
          .status(403)
          .json({ general: "Incorrect password, please try again" });
      } else if (err.code === "auth/user-not-found") {
        return res
          .status(403)
          .json({ general: "No user with this email, Please signup first!" });
      } else return res.status(500).json({ error: err.code });
    });
  return console.log("login");
});

exports.api = functions.region("europe-west1").https.onRequest(app);
// ddd
