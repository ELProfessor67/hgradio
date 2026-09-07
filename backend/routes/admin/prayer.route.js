import express from "express";
import { PrayerRequest } from "../../models/prayerRequest.model.js";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import { resolveAdminNotifications } from "../../utils/notify.js";

const router = express.Router();

/*
  GET /api/admin/prayer-requests?view=all|pending|private
  The prayer team's inbox. Unlike the public wall this includes private
  requests and public ones awaiting review — the private ones are the whole
  point of the feature for the team, and the pending ones are what needs a
  decision.

  `pendingCount` counts only what an admin can act on: public requests not yet
  approved. A private request never enters that queue.
*/
router.get("/", protect, adminCheck, async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 50);

    const filter =
      req.query.view === "pending"
        ? { visibility: "public", approved: false }
        : req.query.view === "private"
        ? { visibility: "private" }
        : {};

    const [requests, pendingCount] = await Promise.all([
      PrayerRequest.find(filter).sort({ createdAt: -1 }).limit(limit),
      PrayerRequest.countDocuments({ visibility: "public", approved: false }),
    ]);

    res.status(200).json({ success: true, requests, pendingCount });
  } catch (error) {
    console.error("Error fetching prayer requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/*
  PATCH /api/admin/prayer-requests/:id/approve
  Publishes a request to the wall.

  The filter carries `visibility: "public"`, so approving a private request is
  not a mistake an admin can make from the UI or by hand — the request simply
  is not found. That guarantee is the reason the sender's choice is worth
  asking for.
*/
router.patch("/:id/approve", protect, adminCheck, async (req, res) => {
  try {
    const prayer = await PrayerRequest.findOneAndUpdate(
      { _id: req.params.id, visibility: "public" },
      { approved: true, approvedAt: new Date() },
      { new: true }
    );

    if (!prayer) {
      return res.status(404).json({
        success: false,
        message:
          "Not found, or the sender asked for this to stay with the prayer team only.",
      });
    }

    await resolveAdminNotifications(prayer._id, "PrayerRequest");

    res.status(200).json({ success: true, message: "Published to the Prayer Wall", prayer });
  } catch (error) {
    console.error("Error approving prayer request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* Take a published request back off the wall without deleting it. */
router.patch("/:id/unapprove", protect, adminCheck, async (req, res) => {
  try {
    const prayer = await PrayerRequest.findByIdAndUpdate(
      req.params.id,
      { approved: false, approvedAt: null },
      { new: true }
    );

    if (!prayer) {
      return res.status(404).json({ success: false, message: "Prayer request not found" });
    }

    res.status(200).json({ success: true, message: "Removed from the Prayer Wall", prayer });
  } catch (error) {
    console.error("Error unapproving prayer request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/:id", protect, adminCheck, async (req, res) => {
  try {
    const deleted = await PrayerRequest.findByIdAndDelete(req.params.id);
    if (deleted) await resolveAdminNotifications(deleted._id, "PrayerRequest");
    res.status(200).json({ success: true, message: "Prayer request deleted" });
  } catch (error) {
    console.error("Error deleting prayer request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
