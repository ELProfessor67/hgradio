import express from "express";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import {
  adminListLoveGifts,
  adminLoveGiftsByArtist,
} from "../../controllers/admin/loveGifts.controller.js";

const router = express.Router();

router.get("/by-artist", protect, adminCheck, adminLoveGiftsByArtist);
router.get("/", protect, adminCheck, adminListLoveGifts);

export default router;
