import express from "express";
import {
  changeEmail,
  changePassword,
  createAlbum,
  getAlbumsByArtist,
  updateUser,
} from "../../controllers/user/user.controller.js";
import protect from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.put("/update", protect, updateUser);
router.put("/:userId/change-email", protect, changeEmail);
router.put("/:userId/change-password", protect, changePassword);
router.post("/add-album", protect, createAlbum);
router.get("/get-albums", protect, getAlbumsByArtist);


export default router;
