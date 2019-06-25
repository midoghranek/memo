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
          userImage: doc.data().userImage,
          createdAt: doc.data().createdAt,
          likeCount: doc.data().likeCount,
          commentCount: doc.data().commentCount
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
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };
  db.collection("memes")
    .add(newMeme)
    .then(doc => {
      const resMeme = newMeme;
      resMeme.memeId = doc.id;
      return res.json(resMeme);
    })
    .catch(err => {
      res.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
  return console.log("Created a new meme");
};

// Get one meme
exports.getOneMeme = (req, res) => {
  let memeData = {};
  db.doc(`/memes/${req.params.memeId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Meme not found" });
      }
      memeData = doc.data();
      memeData.memeId = doc.id;
      return db
        .doc(`/memes/${doc.id}`)
        .collection("comments")
        .orderBy("createdAt", "asc")
        .get();
    })
    .then(data => {
      memeData.comments = [];
      data.forEach(doc => {
        memeData.comments.push(doc.data());
      });
      return res.json(memeData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Comment on a meme
exports.CommentOnMeme = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ comment: "Must not be empty" });
  } else {
    const newComment = {
      memeId: req.params.memeId,
      body: req.body.body,
      createdAt: new Date().toISOString(),
      userHandle: req.user.handle,
      userImage: req.user.imageUrl
    };
    return db
      .doc(`/memes/${req.params.memeId}`)
      .get()
      .then(doc => {
        if (!doc.exists) {
          return res.status(404).json({ error: "Meme not found" });
        }
        return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
      })
      .then(() => {
        return db
          .doc(`/memes/${req.params.memeId}`)
          .collection("comments")
          .add(newComment);
      })
      .then(() => {
        return res.json(newComment);
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: "Something went wrong" });
      });
  }
};

// like a meme
exports.likeMeme = (req, res) => {
  const memeDocument = db.doc(`/memes/${req.params.memeId}`);
  const likeDocument = db
    .doc(`/memes/${req.params.memeId}`)
    .collection("likes")
    .doc(req.user.userId);
  let memeData;
  memeDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        memeData = doc.data();
        memeData.memeId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Meme not found" });
      }
    })
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ error: "Meme already liked" });
      } else {
        // eslint-disable-next-line promise/no-nesting
        return db
          .doc(`/memes/${req.params.memeId}`)
          .collection("likes")
          .doc(req.user.userId)
          .set({
            memeId: req.params.memeId,
            userHandle: req.user.handle,
            userImage: req.user.imageUrl
          })
          .then(() => {
            memeData.likeCount++;
            return memeDocument.update({ likeCount: memeData.likeCount });
          })
          .then(() => {
            return res.json(memeData);
          });
      }
    })
    .catch(err => {
      return res.status(500).json({ error: err.code });
    });
};

// unlike a meme
exports.unlikeMeme = (req, res) => {
  const memeDocument = db.doc(`/memes/${req.params.memeId}`);
  const likeDocument = db
    .doc(`/memes/${req.params.memeId}`)
    .collection("likes")
    .doc(req.user.userId);
  let memeData;
  memeDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        memeData = doc.data();
        memeData.memeId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Meme not found" });
      }
    })
    .then(doc => {
      if (doc.exists) {
        // eslint-disable-next-line promise/no-nesting
        return db
          .doc(`/memes/${req.params.memeId}`)
          .collection("likes")
          .doc(req.user.userId)
          .delete()
          .then(() => {
            memeData.likeCount--;
            return memeDocument.update({ likeCount: memeData.likeCount });
          })
          .then(() => {
            return res.json(memeData);
          });
      } else {
        return res.status(400).json({ error: "Meme not liked" });
      }
    })
    .catch(err => {
      return res.status(500).json({ error: err.code });
    });
};

// delete a meme
exports.deleteMeme = (req, res) => {
  const document = db.doc(`/memes/${req.params.memeId}`);
  document
    .get()
    .then(doc => {
      if (doc.exists) {
        if (doc.data().userHandle === req.user.handle) {
          return document.delete();
        } else {
          return res.status(403).json({ error: "Unauthorized" });
        }
      } else {
        return res.status(404).json({ error: "Meme not found" });
      }
    })
    .then(() => {
      return res.json({ message: "Meme deleted successfully" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
