import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["album_approved", "album_rejected", "seller_approved", "seller_rejected", "contract_approved", "contract_rejected", "general"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    // Optional refs
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    refModel: { type: String, default: null }, // "Album" | "User"
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
