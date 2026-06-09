import express from "express";
import { Testimonial } from "../../models/testimonial.model.js";

const router = express.Router();

// Get paginated testimonials
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const testimonials = await Testimonial.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Testimonial.countDocuments();

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

export default router;
