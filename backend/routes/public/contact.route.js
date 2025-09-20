import express from "express";
import {
  createContact,
  deleteContact,
  getAllContact,
  processPayment,
} from "../../controllers/public/contact.controller.js";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", createContact);
router.get(
  "/",
  // protect, adminCheck,
  getAllContact
);
router.delete(
  "/:id",
  // protect, adminCheck,
  deleteContact
);
router.post("/process-payment", processPayment);
export default router;
