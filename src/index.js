const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv/config");

const app = express();

//Midllewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

//Routes
app.use("/auth", require("./routes/auth"));
app.use("/post", require("./routes/post"));

app.listen(3000, () => {
  console.log("Running at port 3000");
});
