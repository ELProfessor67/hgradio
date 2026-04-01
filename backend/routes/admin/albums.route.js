import express from "express";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import {
  adminListAlbums,
  adminGetAlbumById,
  adminApproveAlbum,
  adminRejectAlbum,
} from "../../controllers/admin/albums.controller.js";

const router = express.Router();

router.get("/", protect, adminCheck, adminListAlbums);
router.get("/:albumId", protect, adminCheck, adminGetAlbumById);
router.patch("/:albumId/approve", protect, adminCheck, adminApproveAlbum);
router.patch("/:albumId/reject", protect, adminCheck, adminRejectAlbum);

export default router;
