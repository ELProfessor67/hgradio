import mongoose from "mongoose";

const withdrawRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "completed"],
      default: "pending",
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const WithdrawRequest = mongoose.model("WithdrawRequest", withdrawRequestSchema);

export default WithdrawRequest;


