import mongoose from "mongoose";

/*
  A Love Gift is a donation made from the /donate page.

  All money lands in the station's single Authorize.Net account regardless of who
  the gift is designated for — the admin decides separately what to pay each
  artist. So this record is the designation and the receipt; it never moves money
  on its own and never touches an artist's balance.
*/
const loveGiftSchema = new mongoose.Schema(
  {
    // Donor
    firstName: { type: String, required: true, trim: true },
    // The partner form collects a single "Full Name", so a surname is not always
    // available. Optional rather than required, or those gifts cannot be saved.
    lastName: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    organization: { type: String, default: "", trim: true },

    amount: { type: Number, required: true, min: 0 },
    comment: { type: String, default: "" },

    // Which form the gift came from. Both write here so all designated giving
    // shares one admin view and one payout aggregation.
    source: {
      type: String,
      enum: ["donate", "partner"],
      default: "donate",
      index: true,
    },

    // Who the donor designated the gift for
    recipientType: {
      type: String,
      enum: ["artist", "station"],
      default: "station",
      required: true,
    },

    /*
      Partner-form context, kept for the admin's reference only. These record
      what the partner said they were partnering with; they never decide where
      the money is designated — recipientType above does that.
    */
    partnerType: { type: String, default: "" },
    partnerTarget: { type: String, default: "" },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // Snapshot of the artist's details at gift time — kept so the admin list and
    // the donor's receipt stay truthful if the artist later renames or is removed
    artistName: { type: String, default: "" },
    artistEmail: { type: String, default: "" },
    // The handle matters most here: it is how the admin tells two artists with
    // the same display name apart when deciding who a payout actually goes to
    artistUsername: { type: String, default: "" },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    transactionId: { type: String, trim: true, index: true },
    paidAt: { type: Date },
    failureReason: { type: String, default: "" },
  },
  { timestamps: true }
);

loveGiftSchema.index({ createdAt: -1 });
loveGiftSchema.index({ artist: 1, paymentStatus: 1 });

const LoveGift = mongoose.model("LoveGift", loveGiftSchema);
export default LoveGift;
