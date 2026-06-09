import express from "express";
import { Testimonial } from "../../models/testimonial.model.js";

const router = express.Router();

// Add new testimonial
router.post("/", async (req, res) => {
  try {
    const { name, designation, message, img } = req.body;
    if (!name || !message) {
      return res.status(400).json({ success: false, message: "Name and message are required" });
    }

    const testimonial = new Testimonial({
      name,
      designation,
      message,
      img,
    });

    await testimonial.save();
    res.status(201).json({ success: true, message: "Testimonial added successfully", testimonial });
  } catch (error) {
    console.error("Error adding testimonial:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete testimonial (optional but useful)
router.delete("/:id", async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Testimonial deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
