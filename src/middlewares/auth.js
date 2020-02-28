const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).send({ message: "Authorization not found" });

  const parts = authHeader.split(" ");

  if (!parts.length === 2)
    return res.status(401).send({ message: "Malformed Authorization" });

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme))
    return res.status(401).send({ message: "Malformed Authorization" });

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Invalid token" });
    req.userId = decoded.id;
    return next();
  });
};
