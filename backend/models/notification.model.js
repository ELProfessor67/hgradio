import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        // Inbound — a user submitted something the admin must review
        "album_submitted",
        "seller_submitted",
        "seller_resubmitted",
        // Inbound — money arrived, informational
        "love_gift_received",
        // Outbound — record of an admin decision
        "album_approved",
        "album_rejected",
        "seller_approved",
        "seller_rejected",
        "contract_approved",
        "contract_rejected",
        // Addressed to an artist rather than the admin
        "gift_received_artist",
        "payout_paid",
        "general",
      ],
      required: true,
    },
    /*
      Who this notification is for.
      null  -> the shared admin feed (every account with role "Admin")
      an id -> that one user's feed
      Admin queries must filter on `recipient: null` or artist notifications
      would leak into the admin bell.
    */
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    // Needs an admin decision — drives the "Needs review" filter and badge
    requiresAction: { type: Boolean, default: false },
    // Cleared once the referenced item has been approved/rejected
    resolvedAt: { type: Date, default: null },
    // Optional refs
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    refModel: { type: String, default: null }, // "Album" | "User" | "LoveGift"
    // Denormalised submitter details so the list renders without a populate
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
