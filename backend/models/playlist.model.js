import mongoose from "mongoose";

const playlistSongSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  artist: { type: String, default: "" },
  url: { type: String, required: true },
  duration: { type: Number, default: 0 },     // seconds
  coverImg: { type: String, default: "" },
  source: { type: String, default: "external" }, // "external" | "hgradio"
  addedAt: { type: Date, default: Date.now },
});

const playlistSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    coverImg: { type: String, default: "" },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    songs: { type: [playlistSongSchema], default: [] },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Playlist = mongoose.model("Playlist", playlistSchema);

export default Playlist;
