import mongoose from "mongoose";

/*
  Station-wide settings the admin can change from the panel.

  A single document, found by `key: "global"`. Kept as a collection rather than
  env vars because the admin must be able to change these without a redeploy.
*/
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "global" },


    serviceFeePercent: { type: Number, default: 20, min: 0, max: 100 },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);


settingSchema.statics.getGlobal = function () {
  return this.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const Setting = mongoose.model("Setting", settingSchema);
export default Setting;
