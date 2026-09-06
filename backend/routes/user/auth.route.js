import express from "express";
import {
  deleteUser,
  forgotPassword,
  getCurrentUser,
  loginUser,
  registerUser,
  resetPassword,
  requestRegisterOtp,
  verifyRegisterOtp,
  resendRegisterOtp,
  requestUpgradeOtp,
  verifyUpgradeOtp,
  upgradeToSeller,
  checkUsername,
} from "../../controllers/user/auth.controller.js";


const router = express.Router();


router.post("/register", registerUser);
router.get("/username-available", checkUsername);
router.post("/register-otp/request", requestRegisterOtp);
router.post("/register-otp/verify", verifyRegisterOtp);
router.post("/register-otp/resend", resendRegisterOtp);
router.post("/login", loginUser);
router.get("/me/:userId", getCurrentUser);
router.delete("/delete-user/:userId", deleteUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/upgrade-otp/request", requestUpgradeOtp);
router.post("/upgrade-otp/verify", verifyUpgradeOtp);
router.post("/upgrade-to-seller", upgradeToSeller);


export default router;
