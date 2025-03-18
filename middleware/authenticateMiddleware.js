const jwt = require("jsonwebtoken");

const authenticateMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Unauthorized: Token expired or invalid" });
    }

    req.user = decoded;
    next();
  });
};

module.exports = authenticateMiddleware;
