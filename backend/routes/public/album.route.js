import express from "express";
import {
  getAlbumById,
  getAllAlbums,
  getTopSoldAlbums,
} from "../../controllers/public/album.controller.js";

const router = express.Router();


router.get("/", getAllAlbums);
router.get("/top-sold", getTopSoldAlbums);
router.get("/:albumId", getAlbumById);


export default router;
