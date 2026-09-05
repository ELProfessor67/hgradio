import express from "express";
import { Testimonial } from "../../models/testimonial.model.js";
import { createPendingTestimony } from "../../utils/testimony.js";

const router = express.Router();

const PUBLIC_FILTER = { approved: { $ne: false } };

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const testimonials = await Testimonial.find(PUBLIC_FILTER)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Testimonial.countDocuments(PUBLIC_FILTER);

    res.status(200).json({
      success: true,
      testimonials,
      hasMore: skip + testimonials.length < total,
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/", async (req, res) => {
  try {
    const {
      firstName = "",
      lastName = "",
      name = "",
      email = "",
      location = "",
      message = "",
    } = req.body || {};

    // Accept either a single `name` or the first/last pair the app's forms use.
    const fullName = (name || `${firstName} ${lastName}`).trim();

    if (!fullName) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!String(message).trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const testimonial = await createPendingTestimony({
      name: fullName,
      email,
      location,
      message: String(message).trim(),
    });

    res.status(201).json({
      success: true,
      message: "Thank you — your testimony has been sent for review.",
      testimonial,
    });
  } catch (error) {
    console.error("Error submitting testimony:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
