import express from "express";
import {
  changeEmail,
  changePassword,
  createAlbum,
  getAlbumsByArtist,
  getPurchasedAlbums,
  getEarningsSummary,
  getOwnedAlbumById,
  updateOwnedAlbum,
  addAlbumSong,
  deleteAlbumSong,
  purchaseAlbum,
  getAlbumPurchaseStatus,
  requestAlbumOtp,
  verifyAlbumOtp,
  updateUser,
  resubmitSellerForm,
} from "../../controllers/user/user.controller.js";
import protect from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.put("/update", protect, updateUser);
router.put("/:userId/change-email", protect, changeEmail);
router.put("/:userId/change-password", protect, changePassword);
router.post("/album-otp/request", protect, requestAlbumOtp);
router.post("/album-otp/verify", protect, verifyAlbumOtp);

router.get("/earnings-summary", protect, getEarningsSummary);
router.get("/purchased-albums", protect, getPurchasedAlbums);

router.get("/albums/:albumId/purchase-status", protect, getAlbumPurchaseStatus);
router.post("/albums/:albumId/purchase", protect, purchaseAlbum);
router.get("/albums/:albumId/owner", protect, getOwnedAlbumById);
router.patch("/albums/:albumId", protect, updateOwnedAlbum);
router.post("/albums/:albumId/songs", protect, addAlbumSong);
router.delete("/albums/:albumId/songs/:songId", protect, deleteAlbumSong);
router.post("/add-album", protect, createAlbum);
router.get("/get-albums", protect, getAlbumsByArtist);
router.patch("/seller-form/resubmit", protect, resubmitSellerForm);



export default router;
