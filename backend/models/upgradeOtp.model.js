import mongoose from "mongoose";

const upgradeOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    lastSentAt: { type: Date },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Expire documents automatically (Mongo TTL index)
upgradeOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const UpgradeOtp = mongoose.model("UpgradeOtp", upgradeOtpSchema);

export default UpgradeOtp;
