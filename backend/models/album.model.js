import mongoose from "mongoose";

// Define the sub-schema for songs
const audioSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  url: { type: String, required: true },
  views: { type: Number, default: 0 },
});

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    // name: { type: String, required: true },
    releaseYear: { type: Number, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    coverImg: { type: String, required: true },
    songs: { type: [audioSchema], default: [] },
    // Agreement Form Fields
    genre: { type: String, default: "" },
    primaryLanguage: { type: String, default: "" },
    ownershipConfirmation: { type: String, enum: ["sole_owner", "obtained_permission"], required: true },
    rightsAuthorizationDescription: { type: String, default: "" },
    confirmRights: { type: Boolean, required: true },
    confirmNoInfringement: { type: Boolean, required: true },
    confirmContributorsApproved: { type: Boolean, required: true },
    grantLicense: { type: Boolean, required: true },
    acceptResponsibility: { type: Boolean, required: true },
    understandRemovalPolicy: { type: Boolean, required: true },
    indemnifyHGC: { type: Boolean, required: true },
    agreeGoverningLaw: { type: Boolean, required: true },
    agreeLegalCosts: { type: Boolean, required: true },
    confirmReadUnderstood: { type: Boolean, required: true },
    signatureFullName: { type: String, required: true },
    signatureTyped: { type: String, required: true },
    signatureDate: { type: Date, required: true },
    
    // Approval
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    approvalReason: { type: String, default: "" },
    approvedAt: { type: Date },
    // Sales metrics (updated on successful purchase)
    salesCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastSaleAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Album = mongoose.model("Album", albumSchema);

export default Album;
