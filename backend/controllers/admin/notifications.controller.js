import Notification from "../../models/notification.model.js";

// The admin feed is only notifications addressed to no one in particular.
// Anything with a recipient belongs to that artist and must never appear here.
const ADMIN_SCOPE = { recipient: null };
const PENDING_FILTER = { ...ADMIN_SCOPE, requiresAction: true, resolvedAt: null };

// GET /api/admin/notifications?page=1&limit=20&view=all|unread|pending
export const adminListNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // `unreadOnly` kept for backwards compatibility with older clients
    const view = req.query.unreadOnly === "true" ? "unread" : String(req.query.view || "all");

    let filter = { ...ADMIN_SCOPE };
    if (view === "unread") filter = { ...ADMIN_SCOPE, isRead: false };
    else if (view === "pending") filter = PENDING_FILTER;

    const [total, notifications, unreadCount, pendingCount] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ ...ADMIN_SCOPE, isRead: false }),
      Notification.countDocuments(PENDING_FILTER),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
      pendingCount,
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
    await Notification.updateOne({ _id: id, ...ADMIN_SCOPE }, { isRead: true });
    const unreadCount = await Notification.countDocuments({ ...ADMIN_SCOPE, isRead: false });
    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to mark read", error: error.message });
  }
};

// PATCH /api/admin/notifications/read-all
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ ...ADMIN_SCOPE, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, unreadCount: 0 });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to mark all as read", error: error.message });
  }
};

// DELETE /api/admin/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.deleteOne({ _id: id, ...ADMIN_SCOPE });
    const unreadCount = await Notification.countDocuments({ ...ADMIN_SCOPE, isRead: false });
    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete notification", error: error.message });
  }
};

// DELETE /api/admin/notifications/clear-all
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ ...ADMIN_SCOPE });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to clear notifications", error: error.message });
  }
};
