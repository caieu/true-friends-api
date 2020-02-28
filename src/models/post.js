const mongoose = require("../database");

const PostSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  tags: {
    type: Array,
    default: []
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
