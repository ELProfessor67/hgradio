import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      default: "",
    },

    // Set when the entry came from a listener rather than the admin
    email: { type: String, default: "" },
    source: {
      type: String,
      enum: ["admin", "app"],
      default: "admin",
    },

    /*
      Whether this shows on the public site and in the app's Testimonies feed.
      Admin-added entries are approved on creation; testimonies submitted from
      the app wait for review. Public queries test `approved: { $ne: false }`
      rather than `approved: true`, so entries created before this field existed
      stay visible.
    */
    approved: { type: Boolean, default: true },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

testimonialSchema.index({ approved: 1, createdAt: -1 });

export const Testimonial = mongoose.model("Testimonial", testimonialSchema);
