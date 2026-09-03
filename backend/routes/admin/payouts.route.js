import express from "express";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import {
  adminPayoutSummary,
  adminListPayouts,
  adminCreatePayout,
  adminUpdatePayout,
  adminDeletePayout,
} from "../../controllers/admin/payouts.controller.js";

const router = express.Router();

router.get("/summary", protect, adminCheck, adminPayoutSummary);
router.get("/", protect, adminCheck, adminListPayouts);
router.post("/", protect, adminCheck, adminCreatePayout);
router.patch("/:payoutId", protect, adminCheck, adminUpdatePayout);
router.delete("/:payoutId", protect, adminCheck, adminDeletePayout);

export default router;
