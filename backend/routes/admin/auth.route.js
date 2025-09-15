import express from "express";
import {
  deleteAdmin,
  getCurrentAdmin,
  loginAdmin,
  registerAdmin,
} from "../../controllers/admin/auth.controller.js";
import protect from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/me/:adminId", protect, getCurrentAdmin);
router.delete("/:adminId/delete-account", protect, deleteAdmin);

export default router;
