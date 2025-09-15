import mongoose from "mongoose";

// Define the sub-schema for songs
const audioSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  url: { type: String, required: true },
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
  },
  {
    timestamps: true,
  }
);

const Album = mongoose.model("Album", albumSchema);

export default Album;
