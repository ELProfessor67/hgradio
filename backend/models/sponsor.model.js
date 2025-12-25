import mongoose from "mongoose";

const sponsorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    sponsorType: {
      type: String,
      enum: ["program", "individual"],
      required: true,
    },
    sponsorTarget: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      enum: ["prayer", "gift", "other"],
      required: true,
    },
    amount: {
      type: Number,
      required: function () {
        return this.method === "gift";
      },
    },
    otherText: {
      type: String,
      required: function () {
        return this.method === "other";
      },
    },
    comment: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "paid", "failed"],
      default: function () {
        return this.method === "gift" ? "pending" : "not_required";
      },
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Sponsor = mongoose.model("Sponsor", sponsorSchema);

export default Sponsor;
