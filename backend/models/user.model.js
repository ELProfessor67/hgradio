import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const purchasedAlbumSchema = new mongoose.Schema(
  {
    album: { type: mongoose.Schema.Types.ObjectId, ref: "Album", required: true },
    purchasedAt: { type: Date, default: Date.now },
    amount: { type: Number },
    transactionId: { type: String },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String },
    country: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    profileImg: { type: String, default: "" },
    description: { type: String, default: "" },
    role: { type: String, enum: ["Admin", "User"], default: "User" },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    // Album creation OTP gate (verify email + accept agreement before allowing add-album)
    albumOtpHash: { type: String },
    albumOtpExpiresAt: { type: Date },
    albumOtpVerifiedAt: { type: Date },
    albumAgreementAcceptedAt: { type: Date },
    albumOtpLastSentAt: { type: Date },

    purchasedAlbums: { type: [purchasedAlbumSchema], default: [] },

    // Artist earnings (credited on album purchases)
    balance: { type: Number, default: 0 }, // available to withdraw
    totalEarnings: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },

    // Artist consent / release form fields (captured from CreateAccount UI)
    initialGrantAuthorization: { type: String, default: "" },
    initialOwnershipRepresentation: { type: String, default: "" },
    initialLicensingProtection: { type: String, default: "" },
    initialAffiliateUse: { type: String, default: "" },
    initialWaiverCompensation: { type: String, default: "" },
    initialWarranties: { type: String, default: "" },
    initialIndemnification: { type: String, default: "" },
    initialPublicityPromotion: { type: String, default: "" },
    initialLimitationLiability: { type: String, default: "" },
    initialArbitrationVenue: { type: String, default: "" },
    initialGoverningLaw: { type: String, default: "" },
    initialCoverageFullWorks: { type: String, default: "" },
    // NOTE: This field name exists in the UI but is used as "Song/Album Information"
    initialEntireAgreement: { type: String, default: "" },

    copyrightOwnerName: { type: String, default: "" },
    copyrightOwnerSignature: { type: String, default: "" },
    copyrightOwnerDate: { type: Date },

    labelRepresentativeName: { type: String, default: "" },
    labelRepresentativeSignature: { type: String, default: "" },
    labelRepresentativeDate: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
