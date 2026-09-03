import mongoose from "mongoose";
import LoveGift from "../../models/loveGift.model.js";

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
};

/*
  GET /api/admin/love-gifts
  The gift log: who gave, how much, and who it was designated for.
*/
export const adminListLoveGifts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const status = String(req.query.status || "");
    const recipientType = String(req.query.recipientType || "");
    const artistId = String(req.query.artistId || "");
    const q = req.query.q ? String(req.query.q).trim() : "";
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const filter = {};

    if (["pending", "paid", "failed"].includes(status)) filter.paymentStatus = status;
    if (["artist", "station"].includes(recipientType)) filter.recipientType = recipientType;
    if (artistId && mongoose.isValidObjectId(artistId)) filter.artist = artistId;

    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { artistName: { $regex: q, $options: "i" } },
        { transactionId: { $regex: q, $options: "i" } },
      ];
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [total, gifts, totals] = await Promise.all([
      LoveGift.countDocuments(filter),
      LoveGift.find(filter)
        .populate("artist", "_id name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      // Money actually collected, across the whole filtered set rather than this page
      LoveGift.aggregate([
        { $match: { ...filter, paymentStatus: "paid" } },
        { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      collected: Number(totals?.[0]?.amount || 0),
      collectedCount: Number(totals?.[0]?.count || 0),
      gifts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch love gifts",
      error: error.message,
    });
  }
};

/*
  GET /api/admin/love-gifts/by-artist
  One row per artist with the total received on their behalf — the starting point
  for deciding a payout. Amounts here are what donors gave, not what is owed;
  the admin decides each payout amount separately.
*/
export const adminLoveGiftsByArtist = async (req, res) => {
  try {
    const rows = await LoveGift.aggregate([
      { $match: { paymentStatus: "paid", recipientType: "artist", artist: { $ne: null } } },
      {
        $group: {
          _id: "$artist",
          artistName: { $last: "$artistName" },
          totalReceived: { $sum: "$amount" },
          giftCount: { $sum: 1 },
          lastGiftAt: { $max: "$paidAt" },
        },
      },
      { $sort: { totalReceived: -1 } },
    ]);

    const stationTotal = await LoveGift.aggregate([
      { $match: { paymentStatus: "paid", recipientType: "station" } },
      { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    return res.status(200).json({
      success: true,
      artists: rows.map((r) => ({
        artistId: r._id,
        artistName: r.artistName,
        totalReceived: Number(r.totalReceived || 0),
        giftCount: r.giftCount,
        lastGiftAt: r.lastGiftAt,
      })),
      station: {
        totalReceived: Number(stationTotal?.[0]?.amount || 0),
        giftCount: Number(stationTotal?.[0]?.count || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to summarise love gifts",
      error: error.message,
    });
  }
};
