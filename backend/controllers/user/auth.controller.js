import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../utils/util.js";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

export const registerUser = async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      return res.status(400).send({ error: "User already exists" });
    }
    const user = await User.create(req.body);

    const token = generateToken(user._id);

    const { password: _, ...userData } = user._doc;

    res.status(201).send({ success: true, user: userData, token });
  } catch (error) {
    res.status(500).send({ error: "Server error", details: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    if (user.role !== "User") {
      return res.status(403).send({ error: "Access denied for this role" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const parser = new UAParser(req.headers["user-agent"]);
    const deviceInfo = parser.getResult();

    user.lastLoginIp = ip;
    user.lastLoginAt = new Date();
    user.device = deviceInfo.device.type || "Desktop";

    await user.save();
    // user.deviceInfo = {
    //   browser: deviceInfo.browser.name,
    //   os: deviceInfo.os.name,
    //   device: deviceInfo.device.type || "Desktop",
    // };

    // console.log(ip);
    // console.log(deviceInfo);

    const token = generateToken(user._id);

    const { password: _, ...userData } = user._doc;

    res.status(200).send({ success: true, user: userData, token });
  } catch (error) {
    res.status(500).send({ error: "Server error", details: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select(
      "-password -paymentIntentId"
    );

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const remainingDays = calculateRemainingPlanDays(user);

    if (user.isPlanActive && remainingDays === 0) {
      user.isPlanActive = false;
      user.planDuration = 0;
      await user.save();
    }

    const userObj = user.toObject();
    userObj.remainingDays = remainingDays;

    return res.status(200).send({
      success: true,
      user: userObj,
    });
  } catch (error) {
    return res.status(500).send({
      error: "Server error",
      details: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).send({
        success: false,
        message: "Not authorized to delete this user.",
      });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res
        .status(404)
        .send({ success: false, message: "User not found." });
    }

    res
      .status(200)
      .send({ success: true, message: "User deleted successfully." });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error.", error });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash it before saving to DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token & expiry in DB
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Create frontend reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });

    res
      .status(200)
      .send({ success: true, message: "Reset link sent to email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpire");;

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);
    user.password = password;

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successful." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
