const jwt = require("jsonwebtoken");

function authenticateMiddleware(req, res, next) {
  const token = req.cookies.token; // Assuming token is stored in an httpOnly cookie

  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to the request object
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token." });
  }
}

module.exports = authenticateMiddleware;
