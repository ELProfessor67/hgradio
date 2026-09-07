import mongoose from "mongoose";

/*
  A prayer request sent from the app or the website.

  These used to be stored as Contact rows with a "[PRAYER REQUEST]" prefix and
  the sender's sharing choice written into the comment text, which meant the
  choice was a note to whoever read the inbox and nothing more — nothing in
  software ever acted on it, and there was nowhere for a shared request to
  appear. This collection makes the choice structural.

  Two gates stand between a request and the public Prayer Wall:

    visibility === "public"   the sender gave permission
    approved === true         an admin reviewed it

  Both are required. A request the sender marked private can never be published
  no matter what an admin clicks, because the public query filters on
  visibility first.
*/
const prayerRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    message: { type: String, required: true },

    /*
      Whom the sender is willing to let see this. Private is the default at
      every layer — model, API and form — so a missing or unrecognised value
      can only ever fail closed.
    */
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    /*
      Public requests wait for review before they appear anywhere. Unlike
      Testimonial (whose default is true, for admin-authored entries), nothing
      here is ever authored by an admin, so the default is false.
    */
    approved: { type: Boolean, default: false },
    approvedAt: { type: Date },

    /*
      How many people have tapped "I prayed for this". This is the
      "participate" half of the client's ask — a wall you can only read is a
      noticeboard, not a place people pray together.
    */
    prayerCount: { type: Number, default: 0 },

    source: { type: String, enum: ["app", "web"], default: "app" },
  },
  { timestamps: true }
);

// The public wall's exact query: public + approved, newest first.
prayerRequestSchema.index({ visibility: 1, approved: 1, createdAt: -1 });

export const PrayerRequest = mongoose.model("PrayerRequest", prayerRequestSchema);

export default PrayerRequest;
