import express from "express";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import {
  adminListNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "../../controllers/admin/notifications.controller.js";

const router = express.Router();

router.get("/", protect, adminCheck, adminListNotifications);
router.patch("/read-all", protect, adminCheck, markAllNotificationsRead);
router.patch("/:id/read", protect, adminCheck, markNotificationRead);
router.delete("/clear-all", protect, adminCheck, clearAllNotifications);
router.delete("/:id", protect, adminCheck, deleteNotification);

export default router;
