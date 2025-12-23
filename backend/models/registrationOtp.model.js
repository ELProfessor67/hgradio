import mongoose from "mongoose";

const registrationOtpSchema = new mongoose.Schema(
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
registrationOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RegistrationOtp = mongoose.model("RegistrationOtp", registrationOtpSchema);

export default RegistrationOtp;


