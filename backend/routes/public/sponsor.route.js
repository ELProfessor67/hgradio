import express from "express";

import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import { createSponsor, deleteSponsor, getAllSponsor, processSponsorPayment } from "../../controllers/public/sponsor.controller.js";

const router = express.Router();

router.post("/", createSponsor);
router.post("/process-payment", processSponsorPayment);
router.get(
  "/",
  // protect, adminCheck,
  getAllSponsor
);
router.delete(
  "/:id",
  // protect, adminCheck,
  deleteSponsor
);
export default router;
