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

    /*
      An artist's public handle, and the thing that tells two artists with the
      same display name apart before money is sent to one of them. Unique, but
      sparse and with no default: every account that predates this field has no
      username at all, and a sparse index skips missing values while an empty
      string would collide on the second such account.
    */
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]{3,20}$/, "Username must be 3-20 characters: letters, numbers or underscore"],
    },
    // Shown beside an artist's name wherever they are chosen, so two artists
    // with the same display name can be told apart before money is sent
    genre: { type: String, default: "" },
    description: { type: String, default: "" },
    role: { type: String, enum: ["Admin", "User"], default: "User" },
    // Account type inside "User" role
    accountType: { type: String, enum: ["buyer", "seller"], default: "buyer" },
    // Seller admin approval (required to add albums)
    sellerApprovalStatus: {
      type: String,
      enum: ["not_required", "pending", "approved", "rejected"],
      default: "not_required",
    },
    sellerApprovalReason: { type: String, default: "" },
    sellerReviewedAt: { type: Date },
    sellerReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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

    digitalDistributionArtistName: { type: String, default: "" },
    digitalDistributionArtistSignature: { type: String, default: "" },
    digitalDistributionArtistDate: { type: Date },
    digitalDistributionStageName: { type: String, default: "" },
    digitalDistributionRepName: { type: String, default: "" },
    digitalDistributionRepTitle: { type: String, default: "" },
    digitalDistributionRepSignature: { type: String, default: "" },
    digitalDistributionRepDate: { type: Date },
    digitalDistributionDigitalStoreOption: { type: String, default: "" },
    digitalDistributionSummaryName: { type: String, default: "" },
    digitalDistributionSummarySignature: { type: String, default: "" },
    digitalDistributionSummaryDate: { type: Date },
    artistSignatureUrl: { type: String, default: "" },
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
