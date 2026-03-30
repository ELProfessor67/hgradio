import express from "express";
import { getDashboardStats } from "../../controllers/admin/analytics.controller.js";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// protect and adminCheck ensure only admins can access these stats
router.get("/stats", protect, adminCheck, getDashboardStats);

export default router;
