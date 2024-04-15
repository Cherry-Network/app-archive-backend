const express = require("express");
const { getDb } = require("../database");
const bycrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const router = express.Router();

//Signup
router.post("/signup", async (req, res) => {
  const { email, password, username } = req.body;
  const db = await getDb();

  let passwordHash = await bycrypt.hash(password, 10);

  await db.collection("users").insertOne({
    username,
    email,
    password: passwordHash,
    followers: [],
    following: [],
  });
  res.send("User created");
});

//Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const db = await getDb();

  const user = await db.collection("users").findOne({ username });
  if (!user) {
    return res.status(400).send("Invalid username or password");
  }

  const isPasswordValid = await bycrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(403).send("Invalid username or password");
  }
  res.send("Logged in");
});

//Create post
router.post("/post", async (req, res) => {
  const { title, content, username } = req.body;
  const db = await getDb();

  await db
    .collection("posts")
    .insertOne({ title, content, username, likes: 0 });
  res.send("Post created");
});

//Get all posts
router.get("/post/:username", async (req, res) => {
  const { username } = req.params;
  const db = await getDb();
  const posts = await db
    .collection("posts")
    .find({
      username,
    })
    .toArray();
  res.send(posts);
});

//Delete post
router.delete("/post/:id", async (req, res) => {
  const { id } = req.params;
  const _id = new ObjectId(id);
  const db = await getDb();
  await db.collection("posts").deleteOne({ _id });
  res.send("Post deleted");
});

//Like post
router.put("/post/like/:id", async (req, res) => {
  const { id } = req.params;
  const _id = new ObjectId(id);
  const db = await getDb();
  await db.collection("posts").updateOne({ _id }, { $inc: { likes: 1 } });
  res.send("Post liked");
});

//Follow user
router.put("/follow/:username", async (req, res) => {
  const { username } = req.params;
  const { follower } = req.body;
  const db = await getDb();

  await db.collection("users").updateOne(
    { username },
    {
      $push: {
        followers: follower,
      },
    }
  );

  await db.collection("users").updateOne(
    { username: follower },
    {
      $push: {
        following: username,
      },
    }
  );
  res.send("Followed");
});

//Get connections
router.get("/connections/:username", async (req, res) => {
  const { username } = req.params;
  const db = await getDb();
  const user = await db.collection("users").findOne({ username });
  res.status(200).json({
    following: user.following,
    followers: user.followers,
  });
});

//Unfollow user
router.delete("/unfollow/:username", async (req, res) => {
  const { username } = req.params;
  const { follower } = req.body;
  const db = await getDb();

  await db.collection("users").updateOne(
    { username },
    {
      $pull: {
        followers: follower,
      },
    }
  );

  await db.collection("users").updateOne(
    { username: follower },
    {
      $pull: {
        following: username,
      },
    }
  );
  res.send("Unfollowed");
});

module.exports = router;
