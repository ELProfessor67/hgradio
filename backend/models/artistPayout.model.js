import mongoose from "mongoose";


const artistPayoutSchema = new mongoose.Schema(
  {
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    artistName: { type: String, default: "" },
    artistEmail: { type: String, default: "" },


    grossAmount: { type: Number, default: 0, min: 0 },
    serviceFeePercent: { type: Number, default: null, min: 0, max: 100 },
    serviceFeeAmount: { type: Number, default: 0, min: 0 },

    amount: { type: Number, required: true, min: 0 },

    // What the artist had received in gifts when this payout was raised — recorded
    // so the figure the admin was looking at stays visible later, even as new
    // gifts come in and change the running total.
    giftsReceivedAtCreation: { type: Number, default: 0 },

    note: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      index: true,
    },

    proofUrl: { type: String, default: "" },

    paidAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

artistPayoutSchema.index({ createdAt: -1 });
artistPayoutSchema.index({ artist: 1, status: 1 });

const ArtistPayout = mongoose.model("ArtistPayout", artistPayoutSchema);
export default ArtistPayout;
