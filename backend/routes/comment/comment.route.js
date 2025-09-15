import express from "express";
import { getCommentsByAlbumId, getCommentsByUser, saveComment } from "../../controllers/comment/comment.controller.js";

const router = express.Router();

router.post("/", saveComment);
router.get("/:albumId", getCommentsByAlbumId);
router.get("/user/:userId", getCommentsByUser);


export default router;
