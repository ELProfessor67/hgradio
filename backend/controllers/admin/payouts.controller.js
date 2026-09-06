import mongoose from "mongoose";
import ArtistPayout from "../../models/artistPayout.model.js";
import LoveGift from "../../models/loveGift.model.js";
import User from "../../models/user.model.js";
import Setting from "../../models/setting.model.js";
import { notifyUser } from "../../utils/notify.js";
import { sendEmail } from "../../utils/util.js";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;


export const adminPayoutSummary = async (req, res) => {
  try {
    const [gifts, payouts] = await Promise.all([
      LoveGift.aggregate([
        { $match: { paymentStatus: "paid", recipientType: "artist", artist: { $ne: null } } },
        {
          $group: {
            _id: "$artist",
            artistName: { $last: "$artistName" },
            artistUsername: { $last: "$artistUsername" },
            received: { $sum: "$amount" },
            giftCount: { $sum: 1 },
            lastGiftAt: { $max: "$paidAt" },
          },
        },
      ]),
      ArtistPayout.aggregate([
        {

          $addFields: {
            _gross: {
              $cond: [{ $gt: [{ $ifNull: ["$grossAmount", 0] }, 0] }, "$grossAmount", "$amount"],
            },
          },
        },
        {
          $group: {
            _id: "$artist",
            artistName: { $last: "$artistName" },
            paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] } },
            paidGross: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$_gross", 0] } },
            pendingGross: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$_gross", 0] } },
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
        artistUsername: g.artistUsername || "",
        received: Number(g.received || 0),
        giftCount: g.giftCount,
        lastGiftAt: g.lastGiftAt,
        paid: 0,
        pending: 0,
        paidGross: 0,
        pendingGross: 0,
        payoutCount: 0,
      });
    }

    for (const p of payouts) {
      const key = String(p._id);
      const existing = rows.get(key) || {
        artistId: p._id,
        artistName: p.artistName || "",
        artistUsername: "",
        received: 0,
        giftCount: 0,
        lastGiftAt: null,
        paid: 0,
        pending: 0,
        paidGross: 0,
        pendingGross: 0,
        payoutCount: 0,
      };
      existing.paid = Number(p.paid || 0);
      existing.pending = Number(p.pending || 0);
      existing.paidGross = Number(p.paidGross || 0);
      existing.pendingGross = Number(p.pendingGross || 0);
      existing.payoutCount = p.payoutCount;
      if (!existing.artistName) existing.artistName = p.artistName || "";
      rows.set(key, existing);
    }

    /*
      Fill in anything the snapshots missed. A handle claimed after an artist's
      last gift was never snapshotted, so the live account is the only source —
      and this is the screen where the admin decides who actually gets paid.
    */
    const missing = [...rows.values()]
      .filter((r) => !r.artistName || !r.artistUsername)
      .map((r) => r.artistId);
    if (missing.length) {
      const users = await User.find({ _id: { $in: missing } }).select("_id name username");
      for (const u of users) {
        const row = rows.get(String(u._id));
        if (!row) continue;
        if (!row.artistName) row.artistName = u.name;
        if (!row.artistUsername) row.artistUsername = u.username || "";
      }
    }

    const artists = [...rows.values()]
      .map((r) => ({
        ...r,
        outstanding: Number((r.received - r.paidGross - r.pendingGross).toFixed(2)),
      }))
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
        .populate("artist", "_id name email username")
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


export const adminCreatePayout = async (req, res) => {
  try {
    const { artistId, grossAmount, amount, serviceFeePercent, note } = req.body || {};
    const grossNum = Number(grossAmount ?? amount);

    if (!artistId || !mongoose.isValidObjectId(artistId)) {
      return res.status(400).json({ success: false, message: "Choose an artist." });
    }
    if (!Number.isFinite(grossNum) || grossNum <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid amount." });
    }

    const artist = await User.findById(artistId).select("_id name email");
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found." });
    }

    let pct;
    if (serviceFeePercent !== undefined && serviceFeePercent !== null && serviceFeePercent !== "") {
      pct = Number(serviceFeePercent);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({
          success: false,
          message: "Service fee must be a number between 0 and 100.",
        });
      }
    } else {
      const settings = await Setting.getGlobal();
      pct = Number(settings.serviceFeePercent || 0);
    }

    const feeAmount = Math.round(((grossNum * pct) / 100) * 100) / 100;
    const netAmount = Math.round((grossNum - feeAmount) * 100) / 100;

    if (netAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "That fee leaves the artist nothing to be paid. Lower the percentage.",
      });
    }

    const received = await LoveGift.aggregate([
      { $match: { artist: artist._id, paymentStatus: "paid", recipientType: "artist" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);

    const payout = await ArtistPayout.create({
      artist: artist._id,
      artistName: artist.name,
      artistEmail: artist.email,
      grossAmount: grossNum,
      serviceFeePercent: pct,
      serviceFeeAmount: feeAmount,
      amount: netAmount,
      giftsReceivedAtCreation: Number(received?.[0]?.amount || 0),
      note: note || "",
      status: "pending",
      createdBy: req.user?.id,
    });

    // Raised, not yet sent. Told now so the artist sees money coming rather
    // than only hearing about it once it has already gone out.
    await notifyUser({
      userId: artist._id,
      type: "payout_created",
      title: `Payment on the way: ${money(netAmount)}`,
      message: `HGC Radio is preparing a payment of ${money(netAmount)} for you${
        note ? ` — ${note}` : ""
      }.`,
      refId: payout._id,
      refModel: "ArtistPayout",
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


export const adminUpdatePayout = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status, proofUrl, note, grossAmount, serviceFeePercent } = req.body || {};

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


    const feeSupplied =
      serviceFeePercent !== undefined && serviceFeePercent !== null && serviceFeePercent !== "";
    const wantsMoneyChange = grossAmount !== undefined || feeSupplied;

    if (wantsMoneyChange) {
      if (payout.status === "paid") {
        return res.status(400).json({
          success: false,
          message: "A payout already marked paid cannot have its amount or fee changed.",
        });
      }


      const gross =
        grossAmount !== undefined
          ? Number(grossAmount)
          : Number(payout.grossAmount) || Number(payout.amount);
      if (!Number.isFinite(gross) || gross <= 0) {
        return res.status(400).json({ success: false, message: "Enter a valid amount." });
      }

      const pct =
        serviceFeePercent !== undefined && serviceFeePercent !== null && serviceFeePercent !== ""
          ? Number(serviceFeePercent)
          : Number(payout.serviceFeePercent || 0);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({
          success: false,
          message: "Service fee must be a number between 0 and 100.",
        });
      }

      const feeAmount = Math.round(((gross * pct) / 100) * 100) / 100;
      const netAmount = Math.round((gross - feeAmount) * 100) / 100;

      if (netAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "That fee leaves the artist nothing to be paid. Lower the percentage.",
        });
      }

      payout.grossAmount = gross;
      payout.serviceFeePercent = pct;
      payout.serviceFeeAmount = feeAmount;
      payout.amount = netAmount;
    }

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
        message: `HGC Radio has sent you ${money(payout.amount)}${payout.note ? ` — ${payout.note}` : ""
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

    const populated = await ArtistPayout.findById(payout._id).populate("artist", "_id name email username");
    return res.status(200).json({ success: true, message: "Payout updated", payout: populated });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update payout",
      error: error.message,
    });
  }
};

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
