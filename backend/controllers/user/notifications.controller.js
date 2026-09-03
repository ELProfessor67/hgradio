import mongoose from "mongoose";
import Notification from "../../models/notification.model.js";
import ArtistPayout from "../../models/artistPayout.model.js";
import LoveGift from "../../models/loveGift.model.js";

/*
  An artist's own notification feed. Every query is scoped to req.user.id, so one
  artist can never read or modify another's — the id is taken from the verified
  token, never from the request body.
*/

// GET /api/user/notifications?page=&limit=&unreadOnly=
export const listMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const scope = { recipient: userId };
    const filter = req.query.unreadOnly === "true" ? { ...scope, isRead: false } : scope;

    const [total, notifications, unreadCount] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ ...scope, isRead: false }),
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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// PATCH /api/user/notifications/:id/read
export const markMyNotificationRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    await Notification.updateOne({ _id: req.params.id, recipient: userId }, { isRead: true });
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to mark read", error: error.message });
  }
};

// PATCH /api/user/notifications/read-all
export const markAllMyNotificationsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, unreadCount: 0 });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to mark all read", error: error.message });
  }
};

/*
  GET /api/user/my-gifts
  What the artist sees: gifts donors designated for them, and what the station has
  actually sent. Gift totals are what donors gave — not a balance the artist can
  withdraw, since the admin decides each payment.
*/
export const getMyGiftsAndPayouts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const artistObjectId = new mongoose.Types.ObjectId(String(userId));

    const [gifts, payouts, giftTotal, payoutTotals] = await Promise.all([
      /*
        Deliberately no `amount` field. The station collects gift money centrally
        and decides each payout separately, so showing an artist the gross a donor
        gave would advertise a figure they are not going to be paid. They see who
        gave and what was said; what they actually receive is in `payouts`.
        Omitted from the response, not just the UI, so it is not in devtools either.
      */
      LoveGift.find({ artist: userId, paymentStatus: "paid" })
        .select("firstName lastName comment paidAt createdAt")
        .sort({ paidAt: -1 })
        .limit(50),
      ArtistPayout.find({ artist: userId })
        .select("amount note status proofUrl paidAt createdAt")
        .sort({ createdAt: -1 })
        .limit(50),
      LoveGift.aggregate([
        { $match: { artist: artistObjectId, paymentStatus: "paid" } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      ArtistPayout.aggregate([
        { $match: { artist: artistObjectId } },
        {
          $group: {
            _id: null,
            paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] } },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      gifts,
      payouts,
      totals: {
        // no gift value — see the comment on the gifts query above
        giftCount: Number(giftTotal?.[0]?.count || 0),
        paidOut: Number(payoutTotals?.[0]?.paid || 0),
        payoutPending: Number(payoutTotals?.[0]?.pending || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch gifts",
      error: error.message,
    });
  }
};
