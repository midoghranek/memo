// Imports
const { db } = require("../util/admin");

// Get all Memes
exports.getAllMemes = (req, res) => {
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
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount
        });
      });
      return res.json(memes);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Post one meme
exports.postOneMeme = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "Body must not be empty" });
  }
  const newMeme = {
    body: req.body.body,
    userHandle: req.user.handle,
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
  return console.log("Created a new meme");
};
