import User from "../../models/user.model.js";
import Album from "../../models/album.model.js";
import { generateToken } from "./auth.controller.js";
import crypto from "crypto";
import pkg from "authorizenet";

const { APIContracts, APIControllers, Constants: SDKConstants } = pkg;

const ALBUM_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const ALBUM_OTP_VERIFIED_TTL_MS = 15 * 60 * 1000; // 15 minutes to add album after verify

const generateSixDigitOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const hashOtp = (userId, otp) => {
  const secret = process.env.JWT_SECRET || "fallback_secret";
  return crypto
    .createHash("sha256")
    .update(`${userId}:${otp}:${secret}`)
    .digest("hex");
};

const sendOtpEmailViaMailer = async ({ email, otp }) => {
  const resp = await fetch("https://mailer.rafikyconnect.net/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      subject: "Verify OTP",
      message: `Your OTP is> ${otp}`,
    }),
  });

  if (!resp.ok) {
    let details = "";
    try {
      details = await resp.text();
    } catch {
      // ignore
    }
    throw new Error(`Failed to send OTP email. ${details}`);
  }
};



const chargeCardWithAuthorizeNet = async ({
  cardNumber,
  expiryMonth,
  expiryYear,
  cvv,
  amount,
}) => {
  const constants = {
    apiLoginKey: process.env.AUTHORIZENET_API_LOGIN_ID,
    transactionKey: process.env.AUTHORIZENET_TRANSACTION_KEY,
  };

  if (!constants.apiLoginKey || !constants.transactionKey) {
    throw new Error("Authorize.Net credentials are not configured.");
  }

  const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(constants.apiLoginKey);
  merchantAuthenticationType.setTransactionKey(constants.transactionKey);

  const creditCard = new APIContracts.CreditCardType();
  creditCard.setCardNumber(String(cardNumber));
  creditCard.setExpirationDate(`${expiryMonth}-${expiryYear}`);
  creditCard.setCardCode(String(cvv));

  const paymentType = new APIContracts.PaymentType();
  paymentType.setCreditCard(creditCard);

  const transactionSetting = new APIContracts.SettingType();
  transactionSetting.setSettingName("recurringBilling");
  transactionSetting.setSettingValue("false");

  const transactionSettings = new APIContracts.ArrayOfSetting();
  transactionSettings.setSetting([transactionSetting]);

  const transactionRequestType = new APIContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(
    APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
  );
  transactionRequestType.setPayment(paymentType);
  transactionRequestType.setAmount(Number(amount));
  transactionRequestType.setTransactionSettings(transactionSettings);

  const createRequest = new APIContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuthenticationType);
  createRequest.setTransactionRequest(transactionRequestType);

  const ctrl = new APIControllers.CreateTransactionController(
    createRequest.getJSON()
  );

  // Default to production to match existing code; allow override via env
  const env = (process.env.AUTHORIZENET_ENV || "production").toLowerCase();
  ctrl.setEnvironment(
    env === "sandbox" ? SDKConstants.endpoint.sandbox : SDKConstants.endpoint.production
  );

  const response = await new Promise((resolve, reject) => {
    ctrl.execute(() => {
      const apiResponse = ctrl.getResponse();
      const r = new APIContracts.CreateTransactionResponse(apiResponse);

      if (!r) return reject(new Error("No response from payment gateway."));

      if (r.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
        if (r.getTransactionResponse() && r.getTransactionResponse().getMessages()) {
          return resolve({
            success: true,
            transactionId: r.getTransactionResponse().getTransId(),
          });
        }

        if (r.getTransactionResponse() && r.getTransactionResponse().getErrors()) {
          const err = r.getTransactionResponse().getErrors().getError()[0];
          return reject(new Error(err.getErrorText()));
        }

        return reject(new Error("Payment failed."));
      }

      if (r.getTransactionResponse() && r.getTransactionResponse().getErrors()) {
        const err = r.getTransactionResponse().getErrors().getError()[0];
        return reject(new Error(err.getErrorText()));
      }

      const msg = r.getMessages().getMessage()[0];
      return reject(new Error(msg.getText()));
    });
  });

  return response;
};

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

export const requestAlbumOtp = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .send({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    if (user.accountType !== "seller") {
      return res.status(403).send({
        success: false,
        message: "Only seller accounts can add albums.",
      });
    }

    if (user.sellerApprovalStatus !== "approved") {
      return res.status(403).send({
        success: false,
        message: "Your seller form is not approved yet. Please contact the admin.",
      });
    }

    // Basic rate limit (60s) to avoid spam
    if (user.albumOtpLastSentAt) {
      const secondsSinceLast =
        (Date.now() - new Date(user.albumOtpLastSentAt).getTime()) / 1000;
      if (secondsSinceLast < 60) {
        return res.status(429).send({
          success: false,
          message: "Please wait a minute before requesting another OTP.",
        });
      }
    }

    const otp = generateSixDigitOtp();
    user.albumOtpHash = hashOtp(user._id.toString(), otp);
    user.albumOtpExpiresAt = new Date(Date.now() + ALBUM_OTP_TTL_MS);
    user.albumOtpVerifiedAt = undefined;
    user.albumAgreementAcceptedAt = undefined;
    user.albumOtpLastSentAt = new Date();

    await user.save();

    await sendOtpEmailViaMailer({ email: user.email, otp });

    return res.status(200).send({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

export const verifyAlbumOtp = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { otp, agreementAccepted } = req.body || {};

    if (!userId) {
      return res
        .status(401)
        .send({ success: false, message: "Unauthorized" });
    }

    if (!agreementAccepted) {
      return res.status(400).send({
        success: false,
        message: "Please accept the agreement before verifying OTP.",
      });
    }

    if (!otp || String(otp).trim().length === 0) {
      return res
        .status(400)
        .send({ success: false, message: "OTP is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    if (user.accountType !== "seller") {
      return res.status(403).send({
        success: false,
        message: "Only seller accounts can add albums.",
      });
    }

    if (user.sellerApprovalStatus !== "approved") {
      return res.status(403).send({
        success: false,
        message: "Your seller form is not approved yet. Please contact the admin.",
      });
    }

    if (!user.albumOtpHash || !user.albumOtpExpiresAt) {
      return res.status(400).send({
        success: false,
        message: "No OTP request found. Please request OTP first.",
      });
    }

    if (new Date(user.albumOtpExpiresAt).getTime() < Date.now()) {
      return res.status(400).send({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    const expected = user.albumOtpHash;
    const provided = hashOtp(user._id.toString(), String(otp).trim());
    if (provided !== expected) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid OTP" });
    }

    user.albumOtpVerifiedAt = new Date();
    user.albumAgreementAcceptedAt = new Date();
    user.albumOtpHash = undefined;
    user.albumOtpExpiresAt = undefined;
    await user.save();

    return res.status(200).send({
      success: true,
      message: "OTP verified. You can now add an album.",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
};

export const createAlbum = async (req, res) => {
  try {
    const { title, releaseYear, price, description, coverImg, songs } =
      req.body;

    // console.log(title, releaseYear, price, description, coverImg, songs);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    if (user.accountType !== "seller") {
      return res.status(403).send({
        success: false,
        message: "Only seller accounts can add albums.",
      });
    }

    if (user.sellerApprovalStatus !== "approved") {
      const reason = user.sellerApprovalReason
        ? ` Reason: ${user.sellerApprovalReason}`
        : "";
      return res.status(403).send({
        success: false,
        message: `Your seller form is not approved yet. Please contact the admin.${reason}`,
      });
    }

    const verifiedAt = user.albumOtpVerifiedAt
      ? new Date(user.albumOtpVerifiedAt).getTime()
      : 0;
    const agreementAt = user.albumAgreementAcceptedAt
      ? new Date(user.albumAgreementAcceptedAt).getTime()
      : 0;

    const isGateOpen =
      verifiedAt &&
      agreementAt &&
      Date.now() - verifiedAt <= ALBUM_OTP_VERIFIED_TTL_MS &&
      Date.now() - agreementAt <= ALBUM_OTP_VERIFIED_TTL_MS;

    if (!isGateOpen) {
      return res.status(403).send({
        success: false,
        message:
          "Please accept the agreement and verify OTP before adding an album.",
      });
    }

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

export const getAlbumPurchaseStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { albumId } = req.params;

    const user = await User.findById(userId).select("purchasedAlbums");
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const purchased = (user.purchasedAlbums || []).some(
      (p) => p.album?.toString() === albumId
    );

    return res.status(200).send({ success: true, purchased });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to check purchase status",
      error: error.message,
    });
  }
};

export const purchaseAlbum = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { albumId } = req.params;
    const { cardNumber, expiryMonth, expiryYear, cvv } = req.body || {};

    if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
      return res.status(400).send({
        success: false,
        message: "cardNumber, expiryMonth, expiryYear and cvv are required.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).send({ success: false, message: "Album not found" });
    }

    const alreadyPurchased = (user.purchasedAlbums || []).some(
      (p) => p.album?.toString() === albumId
    );
    if (alreadyPurchased) {
      return res.status(200).send({
        success: true,
        purchased: true,
        message: "Album already purchased.",
      });
    }

    const amount = Number(album.price);

    const payment = await chargeCardWithAuthorizeNet({
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      amount,
    });

    user.purchasedAlbums = user.purchasedAlbums || [];
    user.purchasedAlbums.push({
      album: album._id,
      purchasedAt: new Date(),
      amount,
      transactionId: payment.transactionId,
    });
    await user.save();

    // Credit artist + increment album sales metrics
    try {
      await Promise.all([
        Album.findByIdAndUpdate(
          album._id,
          {
            $inc: { salesCount: 1, totalRevenue: amount },
            $set: { lastSaleAt: new Date() },
          },
          { new: false }
        ),
        User.findByIdAndUpdate(
          album.artist,
          { $inc: { balance: amount, totalEarnings: amount } },
          { new: false }
        ),
      ]);
    } catch (e) {
      // Payment + unlock succeeded; metrics failing shouldn't block the user
      console.error("Failed to update sales/earnings metrics:", e);
    }

    return res.status(200).send({
      success: true,
      purchased: true,
      transactionId: payment.transactionId,
      message: "Payment successful. Album unlocked.",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Payment failed",
      error: error.message,
    });
  }
};

export const getEarningsSummary = async (req, res) => {
  try {
    const artistId = req.user?.id;
    if (!artistId) {
      return res
        .status(401)
        .send({ success: false, message: "Unauthorized" });
    }

    const [user, albums] = await Promise.all([
      User.findById(artistId).select("balance totalEarnings totalWithdrawn"),
      Album.find({ artist: artistId }).select("salesCount totalRevenue"),
    ]);

    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const totals = (albums || []).reduce(
      (acc, a) => {
        acc.totalSales += Number(a.salesCount || 0);
        acc.totalRevenue += Number(a.totalRevenue || 0);
        return acc;
      },
      { totalSales: 0, totalRevenue: 0 }
    );

    return res.status(200).send({
      success: true,
      ...totals,
      balance: Number(user.balance || 0),
      totalEarnings: Number(user.totalEarnings || 0),
      totalWithdrawn: Number(user.totalWithdrawn || 0),
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to fetch earnings summary",
      error: error.message,
    });
  }
};

export const getOwnedAlbumById = async (req, res) => {
  try {
    const artistId = req.user?.id;
    const { albumId } = req.params;

    if (!artistId) {
      return res
        .status(401)
        .send({ success: false, message: "Unauthorized" });
    }

    const album = await Album.findById(albumId).populate(
      "artist",
      "_id name profileImg"
    );
    if (!album) {
      return res.status(404).send({ success: false, message: "Album not found" });
    }

    if (album.artist?._id?.toString() !== artistId.toString()) {
      return res
        .status(403)
        .send({ success: false, message: "Forbidden" });
    }

    return res.status(200).send({ success: true, album });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to fetch album",
      error: error.message,
    });
  }
};

export const updateOwnedAlbum = async (req, res) => {
  try {
    const artistId = req.user?.id;
    const { albumId } = req.params;
    const { title, releaseYear, price, description, coverImg } = req.body || {};

    if (!artistId) {
      return res
        .status(401)
        .send({ success: false, message: "Unauthorized" });
    }

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).send({ success: false, message: "Album not found" });
    }
    if (album.artist?.toString() !== artistId.toString()) {
      return res
        .status(403)
        .send({ success: false, message: "Forbidden" });
    }

    if (title !== undefined && String(title).trim() !== "") album.title = title;
    if (releaseYear !== undefined && releaseYear !== null && releaseYear !== "")
      album.releaseYear = Number(releaseYear);
    if (price !== undefined && price !== null && price !== "")
      album.price = Number(price);
    if (description !== undefined && String(description).trim() !== "")
      album.description = description;
    if (coverImg !== undefined && String(coverImg).trim() !== "")
      album.coverImg = coverImg;

    await album.save();

    return res.status(200).send({
      success: true,
      message: "Album updated successfully.",
      album,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to update album",
      error: error.message,
    });
  }
};

export const addAlbumSong = async (req, res) => {
  try {
    const artistId = req.user?.id;
    const { albumId } = req.params;
    const { name, duration, url } = req.body || {};

    if (!artistId) {
      return res
        .status(401)
        .send({ success: false, message: "Unauthorized" });
    }

    if (!name || !url || duration === undefined || duration === null) {
      return res.status(400).send({
        success: false,
        message: "name, duration, and url are required.",
      });
    }

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).send({ success: false, message: "Album not found" });
    }
    if (album.artist?.toString() !== artistId.toString()) {
      return res
        .status(403)
        .send({ success: false, message: "Forbidden" });
    }

    album.songs = album.songs || [];
    album.songs.push({
      name: String(name),
      duration: Number(duration),
      url: String(url),
    });
    await album.save();

    return res.status(201).send({
      success: true,
      message: "Song added successfully.",
      album,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to add song",
      error: error.message,
    });
  }
};

export const deleteAlbumSong = async (req, res) => {
  try {
    const artistId = req.user?.id;
    const { albumId, songId } = req.params;

    if (!artistId) {
      return res
        .status(401)
        .send({ success: false, message: "Unauthorized" });
    }

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).send({ success: false, message: "Album not found" });
    }
    if (album.artist?.toString() !== artistId.toString()) {
      return res
        .status(403)
        .send({ success: false, message: "Forbidden" });
    }

    const song = album.songs?.id(songId);
    if (!song) {
      return res.status(404).send({ success: false, message: "Song not found" });
    }

    song.deleteOne();
    await album.save();

    return res.status(200).send({
      success: true,
      message: "Song deleted successfully.",
      album,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to delete song",
      error: error.message,
    });
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
