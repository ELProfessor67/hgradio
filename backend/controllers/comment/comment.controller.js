import mongoose from "mongoose";
import Album from "../../models/album.model.js";
import Comment from "../../models/comment.model.js";
import User from "../../models/user.model.js";

export const saveComment = async (req, res) => {
  try {
    const {
      userId,
      albumId,
      name,
      email,
      city,
      state,
      country,
      zipCode,
      message,
      rating,
    } = req.body;

    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const commentData = {
      user: userId,
      name,
      email,
      city,
      state,
      country,
      zipCode,
      message,
      rating,
    };

    if (albumId && mongoose.Types.ObjectId.isValid(albumId)) {
      const foundAlbum = await Album.findById(albumId);
      if (!foundAlbum) {
        return res.status(404).json({ message: "Album not found." });
      }
      commentData.album = albumId;
    }

    const newComment = new Comment(commentData);
    await newComment.save();

    res.status(201).json({
      success: true,
      message: "Comment saved successfully.",
      data: newComment,
    });
  } catch (error) {
    console.error("Error saving comment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving comment.",
    });
  }
};

export const getCommentsByAlbumId = async (req, res) => {
  try {
    const albumId = req.params.albumId;

    const comments = await Comment.find({ album: albumId }).sort({
      createdAt: -1,
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCommentsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const comments = await Comment.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error" });
  }
};
