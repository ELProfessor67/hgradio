import Notification from "../../models/notification.model.js";

// GET /api/admin/notifications?page=1&limit=20&unreadOnly=false
export const adminListNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === "true";

    const filter = unreadOnly ? { isRead: false } : {};

    const [total, notifications, unreadCount] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch notifications", error: error.message });
  }
};

// PATCH /api/admin/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    const unreadCount = await Notification.countDocuments({ isRead: false });
    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to mark read", error: error.message });
  }
};

// PATCH /api/admin/notifications/read-all
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, unreadCount: 0 });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to mark all as read", error: error.message });
  }
};

// DELETE /api/admin/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    const unreadCount = await Notification.countDocuments({ isRead: false });
    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete notification", error: error.message });
  }
};

// DELETE /api/admin/notifications/clear-all
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to clear notifications", error: error.message });
  }
};
