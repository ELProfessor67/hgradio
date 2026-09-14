import express from "express";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import {
  adminListUsers,
  adminDeleteUser,
} from "../../controllers/admin/users.controller.js";

const router = express.Router();

router.get("/", protect, adminCheck, adminListUsers);
router.delete("/:userId", protect, adminCheck, adminDeleteUser);

export default router;
