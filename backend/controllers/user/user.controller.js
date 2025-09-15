import User from "../../models/user.model.js";
import Album from "../../models/album.model.js";
import { generateToken } from "./auth.controller.js";

export const updateUser = async (req, res) => {
  const userId = req.user.id;
  const { name, country, city, state, zipCode, profileImg, description } =
    req.body;

  // const defaultProfileImg =
  //   "https://res.cloudinary.com/ddlwhkn3b/image/upload/v1748289152/SIDESONE/blank-profile-picture-973460_960_720-removebg-preview_nzqjpg.png";

  // console.log(onlyFansInfo);

  try {
    const user = await User.findById(userId);

    // console.log(req.user.id, userId);
    

    if (!user)
      return res
        .status(404)
        .send({ success: false, message: "User not found" });

    if (description !== undefined && description !== null && description !== "")
      user.description = description;

    if (profileImg && profileImg.trim() !== "") {
      user.profileImg = profileImg;
    }

    if (name !== undefined && name !== null && name !== "") user.name = name;
    if (country !== undefined && country !== null && country !== "")
      user.country = country;
    if (city !== undefined && city !== null && city !== "") user.city = city;
    if (state !== undefined && state !== null && state !== "")
      user.state = state;
    if (zipCode !== undefined && zipCode !== null && zipCode !== "")
      user.zipCode = zipCode;

    await user.save();

    const token = generateToken(user._id);

    res
      .status(200)
      .json({ success: true, message: "User updated successfully", user, token });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const changeEmail = async (req, res) => {
  try {
    const { password, newEmail, confirmEmail } = req.body;
    const userId = req.params.userId;

    if (req.user?.id.toString() !== req.params.userId) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized: You can only modify your own account",
      });
    }

    if (!password || !newEmail || !confirmEmail) {
      return res
        .status(400)
        .send({ success: false, message: "All fields are required." });
    }

    if (newEmail !== confirmEmail) {
      return res
        .status(400)
        .send({ success: false, message: "Emails do not match." });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .send({ success: false, message: "User not found." });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .send({ success: false, message: "Incorrect password." });
    }

    user.email = newEmail;
    await user.save();

    res
      .status(200)
      .send({ success: true, message: "Email updated successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Server error.", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.params.userId;

    if (req.user?.id.toString() !== req.params.userId) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized: You can only modify your own account",
      });
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .send({ success: false, message: "All fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .send({ success: false, message: "Passwords do not match." });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .send({ success: false, message: "User not found." });

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res
        .status(401)
        .send({ success: false, message: "Incorrect current password." });
    }

    user.password = newPassword;
    await user.save(); // triggers pre-save hook for hashing

    res
      .status(200)
      .send({ success: true, message: "Password updated successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Server error.", error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { isApproved: true, role: "User" };

    const excludedNationalities = [
      "Norway",
      "Sweden",
      "Denmark",
      "Finland",
      "Iceland",
    ];

    if (
      req.query.nationality &&
      req.query.nationality !== "Other" &&
      req.query.nationality !== "View All"
    ) {
      filter.nationality = req.query.nationality;
    } else if (req.query.nationality === "Other") {
      filter.nationality = { $nin: excludedNationalities };
    }

    if (req.query.identity) {
      const identities = Array.isArray(req.query.identity)
        ? req.query.identity
        : [req.query.identity];

      const validIdentities = identities.filter((i) => i !== "Other");

      if (validIdentities.length > 0) {
        filter.identity = { $in: validIdentities };
      }
    }

    const minAgeRaw = req.query.minAge;
    const maxAgeRaw = req.query.maxAge;

    const minAge =
      minAgeRaw !== undefined && minAgeRaw !== null && minAgeRaw !== ""
        ? parseInt(minAgeRaw)
        : NaN;
    const maxAge =
      maxAgeRaw !== undefined && maxAgeRaw !== null && maxAgeRaw !== ""
        ? parseInt(maxAgeRaw)
        : NaN;

    if (!isNaN(minAge) || !isNaN(maxAge)) {
      const ageConditions = {};
      if (!isNaN(minAge)) ageConditions.$gte = minAge;
      if (!isNaN(maxAge)) ageConditions.$lte = maxAge;

      filter.$or = [
        { age: ageConditions },
        { age: { $exists: false } },
        { age: null },
      ];
    }

    const search = req.query.search;
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { userName: { $regex: searchRegex } },
          { name: { $regex: searchRegex } },
        ],
      });
    }

    if (req.query.eyeColors) {
      const colors = Array.isArray(req.query.eyeColors)
        ? req.query.eyeColors
        : [req.query.eyeColors];
      filter.eyeColor = { $in: colors };
    }

    if (req.query.hairColors) {
      const hairs = Array.isArray(req.query.hairColors)
        ? req.query.hairColors
        : [req.query.hairColors];
      filter.hairColor = { $in: hairs };
    }

    if (req.query.heights) {
      const heights = Array.isArray(req.query.heights)
        ? req.query.heights
        : [req.query.heights];
      filter.height = { $in: heights };
    }

    const totalUsers = await User.countDocuments(filter);

    let users = [];

    if (req.query.sortBy === "Most Popular Today") {
      users = await User.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ view: -1, react: -1 });
    } else {
      let sortQuery = { isPlanActive: -1, createdAt: -1 };

      if (req.query.sortBy === "Newest Profile") {
        sortQuery = { createdAt: -1 };
      } else if (req.query.sortBy === "Oldest Profiles") {
        sortQuery = { createdAt: 1 };
      } else if (req.query.sortBy === "Most Liked") {
        sortQuery = { "onlyFansInfo.react": -1 };
      } else if (req.query.sortBy === "Most Videos") {
        sortQuery = { "onlyFansInfo.video": -1 };
      } else if (req.query.sortBy === "Most Pictures") {
        sortQuery = { "onlyFansInfo.img": -1 };
      }

      users = await User.find(filter).skip(skip).limit(limit).sort(sortQuery);
    }

    // console.log(req.query);

    return res.status(200).send({
      success: true,
      data: users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).send({ success: false, message: "Server Error" });
  }
};

export const createAlbum = async (req, res) => {
  try {
    const { title, releaseYear, price, description, coverImg, songs } =
      req.body;

    // console.log(title, releaseYear, price, description, coverImg, songs);

    const album = new Album({
      title,
      releaseYear,
      price,
      description,
      coverImg,
      songs,
      artist: req.user.id,
    });

    await album.save();

    res.status(201).send({
      success: true,
      message: "Album created successfully!!",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAlbumsByArtist = async (req, res) => {
  try {
    const artistId = req.user.id;

    if (!artistId) {
      return res
        .status(400)
        .json({ message: "Artist ID not found in request." });
    }

    const albums = await Album.find({ artist: artistId }).sort({
      createdAt: -1,
    });

    // console.log(albums);
    

    res.status(200).send({ success: true, albums });
  } catch (error) {
    console.error("Error fetching albums:", error);
    res
      .status(500)
      .send({ success: false, message: "Server error while fetching albums." });
  }
};
