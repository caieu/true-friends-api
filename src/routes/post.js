const express = require("express");
const Post = require("../models/post");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    let params = { $and: [] };
    if (req.query.text)
      params.$and.push({ text: new RegExp(`${req.query.text}`, "i") });
    if (req.query.user) params.$and.push({ user: req.query.user });
    if (req.query.tags)
      params.$and.push({ tags: { $in: req.query.tags.split(",") } });
    console.log(params);

    const posts = await Post.find(params.$and.length ? params : {}).populate(
      "user"
    );
    res.send(posts);
  } catch (err) {
    res
      .status(400)
      .send({ message: "Could not find all user posts.", error: err });
  }
});

router.post("/", async (req, res) => {
  try {
    const post = await Post.create(req.body);
    res.send(post);
  } catch (err) {
    res
      .status(400)
      .send({ message: "Could not create a new post.", error: err });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const posts = await Post.findById(req.params.id);
    res.send(posts);
  } catch (err) {
    res.status(400).send({ message: "Could not find the post.", error: err });
  }
});

module.exports = router;
