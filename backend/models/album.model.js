import mongoose from "mongoose";

// Define the sub-schema for songs
const audioSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  url: { type: String, required: true },
  views: { type: Number, default: 0 },
});

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    // name: { type: String, required: true },
    releaseYear: { type: Number, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    coverImg: { type: String, required: true },
    songs: { type: [audioSchema], default: [] },
    // Approval
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    approvalReason: { type: String, default: "" },
    approvedAt: { type: Date },
    // Sales metrics (updated on successful purchase)
    salesCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastSaleAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Album = mongoose.model("Album", albumSchema);

export default Album;
