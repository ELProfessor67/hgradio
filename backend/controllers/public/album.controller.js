import Album from "../../models/album.model.js";
import UserModel from "../../models/user.model.js";

export const getAllAlbums = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    // console.log("hello");

    if (page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ message: "Page and limit must be positive integers." });
    }

    const skip = (page - 1) * limit;

    // // search by title, artist name, artist email
    

    const artistFilter = search ? {
      $or: [
        { name: { $regex: search, $options: "i" } }
      ]
    } : {};

    const artist = await UserModel.find(artistFilter);

    const filter = search ? {
      $or: [
        { title: { $regex: search, $options: "i" } },
        ...artist.map(artist => ({ "artist": artist._id })),
      ]
    } : {};

    const totalAlbums = await Album.countDocuments(filter).populate("artist", "_id name profileImg");
    const totalPages = Math.ceil(totalAlbums / limit);

    const albums = await Album.find(filter)
      .populate("artist", "_id name profileImg")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-songs");;

      // console.log(albums);

    
      

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages,
      totalAlbums,
      albums,
    });
  } catch (error) {
    console.error("Error fetching all albums:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching albums." });
  }
};



export const getAlbumById = async (req, res) => {
  try {
    const albumId = req.params.albumId;

    // Find the album by ID
    const album = await Album.findById(albumId).populate('artist', '_id name profileImg');


    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    res.status(200).json(album);
  } catch (error) {
    console.error("Error fetching album by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTopSoldAlbums = async (req, res) => {
  try {
    const limitRaw = req.query.limit;
    const parsed = Number.parseInt(String(limitRaw ?? "10"), 10);
    const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 10;

    const albums = await Album.find({})
      .populate("artist", "_id name profileImg")
      .sort({ salesCount: -1, totalRevenue: -1, lastSaleAt: -1, createdAt: -1 })
      .limit(limit)
      .select("-songs");

    return res.status(200).json({
      success: true,
      limit,
      albums,
    });
  } catch (error) {
    console.error("Error fetching top sold albums:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching top sold albums.",
    });
  }
};

// Increment song view count
export const incrementSongView = async (req, res) => {
  try {
    const { albumId, songId } = req.params;

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    const song = album.songs.id(songId);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    song.views = (song.views || 0) + 1;
    await album.save();

    return res.status(200).json({
      success: true,
      message: "Song view incremented",
      views: song.views,
    });
  } catch (error) {
    console.error("Error incrementing song view:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while incrementing song view.",
    });
  }
};

// Get top songs by views
export const getTopSongs = async (req, res) => {
  try {
    const limitRaw = req.query.limit;
    const parsed = Number.parseInt(String(limitRaw ?? "10"), 10);
    const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 10;

    // Aggregate to get all songs from all albums with their views
    const topSongs = await Album.aggregate([
      // Unwind the songs array to get individual songs
      { $unwind: "$songs" },
      
      // Filter out songs with 0 or null views
      {
        $match: {
          "songs.views": { $gt: 0 }
        }
      },
      
      // Lookup artist information
      {
        $lookup: {
          from: "users",
          localField: "artist",
          foreignField: "_id",
          as: "artistInfo",
        },
      },
      
      // Unwind artist info
      { $unwind: { path: "$artistInfo", preserveNullAndEmptyArrays: true } },
      
      // Project the fields we need
      {
        $project: {
          songId: "$songs._id",
          songName: "$songs.name",
          songUrl: "$songs.url",
          songDuration: "$songs.duration",
          views: { $ifNull: ["$songs.views", 0] },
          albumTitle: "$title",
          albumCover: "$coverImg",
          albumId: "$_id",
          artistName: "$artistInfo.name",
          artistId: "$artistInfo._id",
        },
      },
      
      // Sort by views descending
      { $sort: { views: -1 } },
      
      // Limit results
      { $limit: limit },
    ]);

    return res.status(200).json({
      success: true,
      limit,
      totalSongs: topSongs.length,
      songs: topSongs,
    });
  } catch (error) {
    console.error("Error fetching top songs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching top songs.",
    });
  }
};