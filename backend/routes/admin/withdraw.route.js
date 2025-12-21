import express from "express";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import {
  adminListWithdrawRequests,
  adminUpdateWithdrawStatus,
} from "../../controllers/admin/withdraw.controller.js";

const router = express.Router();

router.get("/requests", protect, adminCheck, adminListWithdrawRequests);
router.patch("/requests/:requestId", protect, adminCheck, adminUpdateWithdrawStatus);

export default router;


