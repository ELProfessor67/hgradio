import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protect = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // console.log(token);
      
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;
      // console.log(decoded);
      
      next();
    } catch (error) {
      console.log("Token verification failed:", error);
      res
        .status(401)
        .send({ success: false, message: "Unauthorized, token failed" });
    }
  } else {
    res
      .status(401)
      .send({ success: false, message: "Unauthorized, no token provided" });
  }
};

export default protect;


export const adminCheck = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found",
      });
    }

    const user = await User.findById(userId);

    if (!user || user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin access only",
      });
    }

    // User is an admin
    next();
  } catch (err) {
    console.error("adminCheck error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during admin check",
    });
  }
};