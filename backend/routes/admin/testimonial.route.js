import express from "express";
import { Testimonial } from "../../models/testimonial.model.js";
import protect, { adminCheck } from "../../middlewares/auth.middleware.js";
import { resolveAdminNotifications } from "../../utils/notify.js";

const router = express.Router();

/*
  GET /api/admin/testimonials?view=all|pending
  The admin list, unlike the public one, includes entries awaiting approval —
  otherwise app testimonies would be invisible to the person meant to
  approve them.
*/
router.get("/", protect, adminCheck, async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const filter = req.query.view === "pending" ? { approved: false } : {};

    const [testimonials, pendingCount] = await Promise.all([
      Testimonial.find(filter).sort({ createdAt: -1 }).limit(limit),
      Testimonial.countDocuments({ approved: false }),
    ]);

    res.status(200).json({ success: true, testimonials, pendingCount });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add new testimonial — admin-authored entries go live immediately
router.post("/", protect, adminCheck, async (req, res) => {
  try {
    const { name, designation, message, img, email, source } = req.body;
    if (!name || !message) {
      return res.status(400).json({ success: false, message: "Name and message are required" });
    }

    const testimonial = new Testimonial({
      name,
      designation,
      message,
      img,
      // Carries the sender's details when the admin approves a testimony that
      // arrived from the app, so nothing is lost when the contact row goes.
      email: email || "",
      source: source === "app" ? "app" : "admin",
      approved: true,
      approvedAt: new Date(),
    });

    await testimonial.save();
    res.status(201).json({ success: true, message: "Testimonial added successfully", testimonial });
  } catch (error) {
    console.error("Error adding testimonial:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Approve a submitted testimony so it appears on the site and in the app
router.patch("/:id/approve", protect, adminCheck, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { approved: true, approvedAt: new Date() },
      { new: true }
    );

    if (!testimonial) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    await resolveAdminNotifications(testimonial._id, "Testimonial");

    res.status(200).json({ success: true, message: "Testimonial approved", testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete testimonial
router.delete("/:id", protect, adminCheck, async (req, res) => {
  try {
    const deleted = await Testimonial.findByIdAndDelete(req.params.id);
    if (deleted) await resolveAdminNotifications(deleted._id, "Testimonial");
    res.status(200).json({ success: true, message: "Testimonial deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
