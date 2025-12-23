import express from "express";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import {
  adminApproveSeller,
  adminGetSellerRequestById,
  adminListSellerRequests,
  adminRejectSeller,
} from "../../controllers/admin/sellerRequests.controller.js";

const router = express.Router();

router.get("/", protect, adminCheck, adminListSellerRequests);
router.get("/:userId", protect, adminCheck, adminGetSellerRequestById);
router.patch("/:userId/approve", protect, adminCheck, adminApproveSeller);
router.patch("/:userId/reject", protect, adminCheck, adminRejectSeller);

export default router;


