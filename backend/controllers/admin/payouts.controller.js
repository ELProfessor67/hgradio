import mongoose from "mongoose";
import ArtistPayout from "../../models/artistPayout.model.js";
import LoveGift from "../../models/loveGift.model.js";
import User from "../../models/user.model.js";
import { notifyUser } from "../../utils/notify.js";
import { sendEmail } from "../../utils/util.js";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

/*
  GET /api/admin/payouts/summary
  One row per artist: what donors gave for them, what has already been sent, and
  what is still outstanding. This is the screen the admin works from.
*/
export const adminPayoutSummary = async (req, res) => {
  try {
    const [gifts, payouts] = await Promise.all([
      LoveGift.aggregate([
        { $match: { paymentStatus: "paid", recipientType: "artist", artist: { $ne: null } } },
        {
          $group: {
            _id: "$artist",
            artistName: { $last: "$artistName" },
            received: { $sum: "$amount" },
            giftCount: { $sum: 1 },
            lastGiftAt: { $max: "$paidAt" },
          },
        },
      ]),
      ArtistPayout.aggregate([
        {
          $group: {
            _id: "$artist",
            artistName: { $last: "$artistName" },
            paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] } },
            payoutCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Merge both sides — an artist may appear in either, or both
    const rows = new Map();

    for (const g of gifts) {
      rows.set(String(g._id), {
        artistId: g._id,
        artistName: g.artistName || "",
        received: Number(g.received || 0),
        giftCount: g.giftCount,
        lastGiftAt: g.lastGiftAt,
        paid: 0,
        pending: 0,
        payoutCount: 0,
      });
    }

    for (const p of payouts) {
      const key = String(p._id);
      const existing = rows.get(key) || {
        artistId: p._id,
        artistName: p.artistName || "",
        received: 0,
        giftCount: 0,
        lastGiftAt: null,
        paid: 0,
        pending: 0,
        payoutCount: 0,
      };
      existing.paid = Number(p.paid || 0);
      existing.pending = Number(p.pending || 0);
      existing.payoutCount = p.payoutCount;
      if (!existing.artistName) existing.artistName = p.artistName || "";
      rows.set(key, existing);
    }

    // Fill in any names the snapshots missed
    const missing = [...rows.values()].filter((r) => !r.artistName).map((r) => r.artistId);
    if (missing.length) {
      const users = await User.find({ _id: { $in: missing } }).select("_id name");
      for (const u of users) {
        const row = rows.get(String(u._id));
        if (row) row.artistName = u.name;
      }
    }

    const artists = [...rows.values()]
      .map((r) => ({ ...r, outstanding: Number((r.received - r.paid - r.pending).toFixed(2)) }))
      .sort((a, b) => b.outstanding - a.outstanding || b.received - a.received);

    return res.status(200).json({
      success: true,
      artists,
      totals: {
        received: artists.reduce((s, a) => s + a.received, 0),
        paid: artists.reduce((s, a) => s + a.paid, 0),
        pending: artists.reduce((s, a) => s + a.pending, 0),
        outstanding: artists.reduce((s, a) => s + a.outstanding, 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to build payout summary",
      error: error.message,
    });
  }
};

// GET /api/admin/payouts?artistId=&status=&page=&limit=
export const adminListPayouts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    const artistId = String(req.query.artistId || "");
    const status = String(req.query.status || "");

    if (artistId && mongoose.isValidObjectId(artistId)) filter.artist = artistId;
    if (["pending", "paid"].includes(status)) filter.status = status;

    const [total, payouts] = await Promise.all([
      ArtistPayout.countDocuments(filter),
      ArtistPayout.find(filter)
        .populate("artist", "_id name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      payouts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payouts",
      error: error.message,
    });
  }
};

// POST /api/admin/payouts  { artistId, amount, note }
export const adminCreatePayout = async (req, res) => {
  try {
    const { artistId, amount, note } = req.body || {};
    const amountNum = Number(amount);

    if (!artistId || !mongoose.isValidObjectId(artistId)) {
      return res.status(400).json({ success: false, message: "Choose an artist." });
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid amount." });
    }

    const artist = await User.findById(artistId).select("_id name email");
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found." });
    }

    const received = await LoveGift.aggregate([
      { $match: { artist: artist._id, paymentStatus: "paid", recipientType: "artist" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);

    const payout = await ArtistPayout.create({
      artist: artist._id,
      artistName: artist.name,
      artistEmail: artist.email,
      amount: amountNum,
      giftsReceivedAtCreation: Number(received?.[0]?.amount || 0),
      note: note || "",
      status: "pending",
      createdBy: req.user?.id,
    });

    return res.status(201).json({ success: true, message: "Payout created", payout });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create payout",
      error: error.message,
    });
  }
};

/*
  PATCH /api/admin/payouts/:payoutId  { status, proofUrl, note }
  Marking a payout paid is what tells the artist the money went out.
*/
export const adminUpdatePayout = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status, proofUrl, note } = req.body || {};

    const payout = await ArtistPayout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found." });
    }

    if (payout.status === "paid" && status === "pending") {
      return res.status(400).json({
        success: false,
        message: "A payout already marked paid cannot be moved back to pending.",
      });
    }

    if (typeof proofUrl === "string") payout.proofUrl = proofUrl;
    if (typeof note === "string") payout.note = note;

    const becomingPaid = status === "paid" && payout.status !== "paid";
    if (becomingPaid) {
      payout.status = "paid";
      payout.paidAt = new Date();
    }

    await payout.save();

    if (becomingPaid) {
      await notifyUser({
        userId: payout.artist,
        type: "payout_paid",
        title: `Payment sent: ${money(payout.amount)}`,
        message: `HGC Radio has sent you ${money(payout.amount)}${
          payout.note ? ` — ${payout.note}` : ""
        }.`,
        refId: payout._id,
        refModel: "ArtistPayout",
      });

      try {
        if (payout.artistEmail) {
          await sendEmail({
            to: payout.artistEmail,
            subject: "Your payment has been sent",
            html: `Hello ${payout.artistName || ""},<br><br>
We have sent you a payment of <strong>${money(payout.amount)}</strong>.<br>
${payout.note ? `Note: ${payout.note}<br>` : ""}
Date: ${new Date().toLocaleDateString()}<br><br>
You can see this in your dashboard.<br><br>
The HG Radio Station Team`,
          });
        }
      } catch (e) {
        console.error("Payout email failed:", e?.message || e);
      }
    }

    const populated = await ArtistPayout.findById(payout._id).populate("artist", "_id name email");
    return res.status(200).json({ success: true, message: "Payout updated", payout: populated });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update payout",
      error: error.message,
    });
  }
};

// DELETE /api/admin/payouts/:payoutId — only while still pending
export const adminDeletePayout = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const payout = await ArtistPayout.findById(payoutId);

    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found." });
    }
    if (payout.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "A payout already marked paid cannot be deleted.",
      });
    }

    await ArtistPayout.deleteOne({ _id: payoutId });
    return res.status(200).json({ success: true, message: "Payout removed" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove payout",
      error: error.message,
    });
  }
};
