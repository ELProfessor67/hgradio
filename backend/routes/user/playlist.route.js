import express from "express";
import protect from "../../middlewares/auth.middleware.js";
import {
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getMyPlaylists,
  getPlaylistById,
  deletePlaylist,
} from "../../controllers/user/playlist.controller.js";

const router = express.Router();

// Playlist CRUD
router.post("/", protect, createPlaylist);                             // Create playlist
router.get("/", protect, getMyPlaylists);                             // Get my playlists
router.get("/:playlistId", protect, getPlaylistById);                 // Get one playlist
router.delete("/:playlistId", protect, deletePlaylist);               // Delete playlist

// Songs inside playlist
router.post("/:playlistId/songs", protect, addSongToPlaylist);        // Add song
router.delete("/:playlistId/songs/:songId", protect, removeSongFromPlaylist); // Remove song

export default router;
