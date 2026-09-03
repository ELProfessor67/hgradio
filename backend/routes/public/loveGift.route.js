import express from "express";
import {
  listGiftableArtists,
  processLoveGift,
} from "../../controllers/public/loveGift.controller.js";

const router = express.Router();

router.get("/artists", listGiftableArtists);
router.post("/process-payment", processLoveGift);

export default router;
