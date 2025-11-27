import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Support both 'id' and 'userId' for backward compatibility
    const userId = decoded.id || decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Invalid token: missing user ID" });
    }
    
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    // Only log unexpected errors, not "invalid signature" or "jwt expired" (these are normal)
    if (err.name !== "JsonWebTokenError" && err.name !== "TokenExpiredError") {
      console.error("JWT error:", err.message);
    }
    res.status(401).json({ error: "Invalid token" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};
