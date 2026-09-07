import express from "express";
import { PrayerRequest } from "../../models/prayerRequest.model.js";
import { createPrayerRequest } from "../../utils/prayer.js";

const router = express.Router();

/*
  The one filter the public wall is allowed to use.

  Note `approved: true` rather than the Testimonial route's `{ $ne: false }`.
  Testimonials predate their own approval flag, so entries created before it
  existed have to stay visible; prayer requests have never existed without it,
  and "unset" here must mean "not yet reviewed", never "show it".
*/
const WALL_FILTER = { visibility: "public", approved: true };

/*
  GET /api/public/prayer-requests
  The Prayer Wall — the app's Encourage > Prayer tab and the website's
  /prayer-wall page both read this.

  Only the sender's name, their words, and how many people have prayed. Email
  and phone are never selected, so a published request cannot leak the contact
  details someone gave so the team could reach them.
*/
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      PrayerRequest.find(WALL_FILTER)
        .select("name message prayerCount createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PrayerRequest.countDocuments(WALL_FILTER),
    ]);

    res.status(200).json({
      success: true,
      requests,
      total,
      hasMore: skip + requests.length < total,
    });
  } catch (error) {
    console.error("Error fetching prayer requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/*
  POST /api/public/prayer-requests
  Accepts either a single `name` or the first/last pair the app's forms use,
  matching the testimonial endpoint so both forms can post the same shape.
*/
router.post("/", async (req, res) => {
  try {
    const {
      firstName = "",
      lastName = "",
      name = "",
      email = "",
      phone = "",
      message = "",
      visibility = "private",
      source = "app",
    } = req.body || {};

    const fullName = (name || `${firstName} ${lastName}`).trim();

    if (!fullName) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!String(message).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please write your prayer request" });
    }

    const prayer = await createPrayerRequest({
      name: fullName,
      email,
      phone,
      message: String(message).trim(),
      visibility,
      source,
    });

    res.status(201).json({
      success: true,
      // The two outcomes differ, so the confirmation the sender reads differs
      // too — telling someone their private request will appear publicly, or
      // the reverse, is the one thing this feature must never do.
      message:
        prayer.visibility === "public"
          ? "Your prayer request has been sent. Once our team has reviewed it, it will appear on the Prayer Wall so others can pray with you."
          : "Your prayer request has been sent to our prayer team. It stays between you and them.",
      visibility: prayer.visibility,
    });
  } catch (error) {
    console.error("Error submitting prayer request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/*
  POST /api/public/prayer-requests/:id/pray
  "I prayed for this" — the participate half of the wall.

  The filter repeats WALL_FILTER rather than updating by id alone, so a request
  that is private or still awaiting review cannot have its counter moved by
  anyone who guesses an id.
*/
router.post("/:id/pray", async (req, res) => {
  try {
    const prayer = await PrayerRequest.findOneAndUpdate(
      { _id: req.params.id, ...WALL_FILTER },
      { $inc: { prayerCount: 1 } },
      { new: true }
    ).select("prayerCount");

    if (!prayer) {
      return res
        .status(404)
        .json({ success: false, message: "Prayer request not found" });
    }

    res.status(200).json({ success: true, prayerCount: prayer.prayerCount });
  } catch (error) {
    console.error("Error recording prayer:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
