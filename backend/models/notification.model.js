import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "album_submitted",
        "seller_submitted",
        "seller_resubmitted",
        "testimonial_submitted",
        "love_gift_received",
        "album_approved",
        "album_rejected",
        "seller_approved",
        "seller_rejected",
        "contract_approved",
        "contract_rejected",
        // Addressed to an artist rather than the admin
        "gift_received_artist",
        "payout_created",
        "payout_paid",
        "withdraw_processing",
        "withdraw_completed",
        "general",
      ],
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    requiresAction: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    refModel: { type: String, default: null }, // "Album" | "User" | "LoveGift"
    actorName: { type: String, default: "" },
    actorEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ requiresAction: 1, resolvedAt: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
