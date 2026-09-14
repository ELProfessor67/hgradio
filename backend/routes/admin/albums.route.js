import express from "express";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import {
  adminListAlbums,
  adminGetAlbumById,
  adminApproveAlbum,
  adminRejectAlbum,
  adminDeleteAlbum,
  adminSyncAlbumsToHGDJ,
} from "../../controllers/admin/albums.controller.js";

const router = express.Router();

router.get("/", protect, adminCheck, adminListAlbums);
// Must precede "/:albumId" so "sync-hgdj" is not read as an album id.
router.post("/sync-hgdj", protect, adminCheck, adminSyncAlbumsToHGDJ);
router.get("/:albumId", protect, adminCheck, adminGetAlbumById);
router.patch("/:albumId/approve", protect, adminCheck, adminApproveAlbum);
router.patch("/:albumId/reject", protect, adminCheck, adminRejectAlbum);
router.delete("/:albumId", protect, adminCheck, adminDeleteAlbum);
router.post("/:albumId/sync-hgdj", protect, adminCheck, adminSyncAlbumsToHGDJ);

export default router;
