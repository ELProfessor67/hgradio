import express from "express";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import {
  adminGetSettings,
  adminUpdateSettings,
} from "../../controllers/admin/settings.controller.js";

const router = express.Router();

router.get("/", protect, adminCheck, adminGetSettings);
router.patch("/", protect, adminCheck, adminUpdateSettings);

export default router;
