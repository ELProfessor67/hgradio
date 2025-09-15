import express from "express";
import { deleteUser, forgotPassword, getCurrentUser, loginUser, registerUser, resetPassword } from "../../controllers/user/auth.controller.js";


const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me/:userId", getCurrentUser);
router.delete("/delete-user/:userId", deleteUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


export default router;
