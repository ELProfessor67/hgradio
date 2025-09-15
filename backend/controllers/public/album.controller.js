import Album from "../../models/album.model.js";

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

    const filter = search ? { title: { $regex: search, $options: "i" } } : {};

    const totalAlbums = await Album.countDocuments(filter);
    const totalPages = Math.ceil(totalAlbums / limit);

    const albums = await Album.find(filter)
      .populate("artist", "name profileImg")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-songs");;

      console.log(albums);
      

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