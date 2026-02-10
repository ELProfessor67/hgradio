import express from "express";
import {
  getAlbumById,
  getAllAlbums,
  getTopSoldAlbums,
  incrementSongView,
  getTopSongs,
} from "../../controllers/public/album.controller.js";

const router = express.Router();


router.get("/", getAllAlbums);
router.get("/top-sold", getTopSoldAlbums);
router.get("/top-songs", getTopSongs);
router.post("/:albumId/song/:songId/view", incrementSongView);
router.get("/:albumId", getAlbumById);


export default router;
