import mongoose from "mongoose";

/*
  A payment the admin sends an artist for love gifts received on their behalf.

  The amount is decided by the admin, not computed. Gift money is collected into
  the station's account and never auto-credited to an artist's balance, so this
  record is the single source of truth for what an artist has actually been paid.
  Kept separate from WithdrawRequest, which covers album-sale earnings and is
  artist-initiated.
*/
const artistPayoutSchema = new mongoose.Schema(
  {
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Snapshot, so the history stays readable if the artist is renamed or removed
    artistName: { type: String, default: "" },
    artistEmail: { type: String, default: "" },

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

    // Screenshot or receipt of the transfer, uploaded by the admin
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
