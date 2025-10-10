import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token not found" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach userId to request
    req.userId = decoded.userId;

    // Proceed to next middleware/route
    next();
  } catch (error) {
    console.error("isAuth error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export default isAuth;
