import express from "express";
import protect from "../../middlewares/auth.middleware.js";
import {
  createWithdrawRequest,
  getMyWithdrawRequests,
} from "../../controllers/user/withdraw.controller.js";

const router = express.Router();

router.post("/", protect, createWithdrawRequest);
router.get("/", protect, getMyWithdrawRequests);

export default router;


