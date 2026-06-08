import mongoose from "mongoose";
import Playlist from "../../models/playlist.model.js";
import { syncSong } from "../../utils/hgdjSync.js";

// ─────────────────────────────────────────────
// POST /api/playlist
// Body: { _id?, name, description?, coverImg?, isPublic? }
// Creates a playlist owned by the logged-in (isOwner) user
// ─────────────────────────────────────────────
export const createPlaylist = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { _id, name, description, coverImg, isPublic } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Playlist name is required" });
    }

    // Use provided _id (must be valid ObjectId) or generate new one
    let playlistId;
    if (_id) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid _id: must be a valid ObjectId" });
      }
      // Check no duplicate
      const existing = await Playlist.findById(_id);
      if (existing) {
        return res
          .status(409)
          .json({ success: false, message: "Playlist with this _id already exists" });
      }
      playlistId = new mongoose.Types.ObjectId(_id);
    } else {
      playlistId = new mongoose.Types.ObjectId();
    }

    const playlist = new Playlist({
      _id: playlistId,
      name: name.trim(),
      description: description || "",
      coverImg: coverImg || "",
      owner: ownerId,
      isPublic: isPublic ?? false,
    });

    await playlist.save();

    return res.status(201).json({
      success: true,
      message: "Playlist created successfully",
      playlist,
    });
  } catch (error) {
    console.error("createPlaylist error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/playlist/:playlistId/songs
// Body: { _id?, title, artist?, url, duration?, coverImg?, source? }
// Add external song to a playlist (owner only)
// ─────────────────────────────────────────────
export const addSongToPlaylist = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { playlistId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid playlistId" });
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res
        .status(404)
        .json({ success: false, message: "Playlist not found" });
    }

    if (playlist.owner.toString() !== ownerId) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: you are not the owner" });
    }

    const { _id, title, artist, url, duration, coverImg, source } = req.body;

    if (!title || !url) {
      return res
        .status(400)
        .json({ success: false, message: "title and url are required" });
    }

    // Use provided song _id or generate
    let songId;
    if (_id) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid song _id: must be a valid ObjectId" });
      }
      // Prevent duplicate song id in this playlist
      const alreadyIn = playlist.songs.some(
        (s) => s._id.toString() === _id.toString()
      );
      if (alreadyIn) {
        return res.status(409).json({
          success: false,
          message: "Song with this _id already exists in the playlist",
        });
      }
      songId = new mongoose.Types.ObjectId(_id);
    } else {
      songId = new mongoose.Types.ObjectId();
    }

    const newSong = {
      _id: songId,
      title,
      artist: artist || "",
      url,
      duration: duration || 0,
      coverImg: coverImg || "",
      source: source || "external",
      addedAt: new Date(),
    };

    playlist.songs.push(newSong);
    await playlist.save();

    // Sync song to HGDJLive playlist (fail-safe)
    try {
      await syncSong({
        _id:        String(newSong._id),
        title:      newSong.title,
        audio:      newSong.url,
        audioEx:    "mp3",
        cover:      newSong.coverImg || "",
        coverEx:    "jpg",
        size:       0,
        type:       "audio/mpeg",
        duration:   newSong.duration || 0,
        artist:     newSong.artist || "",
        playlistId: String(playlistId),
      });
    } catch (e) {
      console.error("[addSongToPlaylist] HGDJLive sync failed:", e?.message || e);
    }

    return res.status(200).json({
      success: true,
      message: "Song added to playlist",
      song: newSong,
      totalSongs: playlist.songs.length,
    });
  } catch (error) {
    console.error("addSongToPlaylist error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/playlist/:playlistId/songs/:songId
// Remove a song from a playlist (owner only)
// ─────────────────────────────────────────────
export const removeSongFromPlaylist = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { playlistId, songId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (playlist.owner.toString() !== ownerId) {
      return res.status(403).json({ success: false, message: "Forbidden: you are not the owner" });
    }

    const songIndex = playlist.songs.findIndex(
      (s) => s._id.toString() === songId
    );
    if (songIndex === -1) {
      return res.status(404).json({ success: false, message: "Song not found in playlist" });
    }

    playlist.songs.splice(songIndex, 1);
    await playlist.save();

    return res.status(200).json({
      success: true,
      message: "Song removed from playlist",
      totalSongs: playlist.songs.length,
    });
  } catch (error) {
    console.error("removeSongFromPlaylist error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/playlist
// Get all playlists of the logged-in user
// ─────────────────────────────────────────────
export const getMyPlaylists = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const playlists = await Playlist.find({ owner: ownerId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: playlists.length,
      playlists,
    });
  } catch (error) {
    console.error("getMyPlaylists error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/playlist/:playlistId
// Get a single playlist (owner sees their own; public ones visible to all)
// ─────────────────────────────────────────────
export const getPlaylistById = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { playlistId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return res.status(400).json({ success: false, message: "Invalid playlistId" });
    }

    const playlist = await Playlist.findById(playlistId).populate("owner", "name email profileImg");
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    const isOwner = playlist.owner._id.toString() === ownerId;
    if (!playlist.isPublic && !isOwner) {
      return res.status(403).json({ success: false, message: "This playlist is private" });
    }

    return res.status(200).json({ success: true, playlist });
  } catch (error) {
    console.error("getPlaylistById error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/playlist/:playlistId
// Delete a playlist (owner only)
// ─────────────────────────────────────────────
export const deletePlaylist = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { playlistId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return res.status(400).json({ success: false, message: "Invalid playlistId" });
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (playlist.owner.toString() !== ownerId) {
      return res.status(403).json({ success: false, message: "Forbidden: you are not the owner" });
    }

    await playlist.deleteOne();

    return res.status(200).json({ success: true, message: "Playlist deleted" });
  } catch (error) {
    console.error("deletePlaylist error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
