const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const router = express.Router();
const jwt = require("jsonwebtoken");

const generateToken = id => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET, {
    expiresIn: 86400
  });
};

router.post("/register", async (req, res) => {
  try {
    const user = await User.create(req.body);
    user.password = undefined;
    res.send({ user, token: generateToken() });
  } catch (err) {
    return res
      .status(400)
      .send({ message: "Registration failed.", error: err });
  }
});

router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).send({ message: "User not found." });
    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).send({ message: "Invalid password." });
    user.password = undefined;

    return res.send({ user, token: generateToken() });
  } catch (err) {
    res.status(400).send({ message: "Unable to authenticate.", error: err });
  }
});

module.exports = router;
