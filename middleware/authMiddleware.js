const { verifyToken } = require('../library/jwt');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (token == null) return res.sendStatus(401); // If no token, return unauthorized

  try {
    const user = verifyToken(token);
    req.user = user; // Attach user info to request object
    next(); // Pass control to the next handler
  } catch (err) {
    res.sendStatus(403); // If token is invalid, return forbidden
  }
};

module.exports = authenticateToken;
