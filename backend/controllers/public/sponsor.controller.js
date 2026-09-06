import Sponsor from "../../models/sponsor.model.js";
import LoveGift from "../../models/loveGift.model.js";
import User from "../../models/user.model.js";
import { chargeCard } from "./loveGift.controller.js";
import { sendEmail } from "../../utils/util.js";
import { notifyAdmin, notifyUser } from "../../utils/notify.js";

export const createSponsor = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.amount !== undefined && payload.amount !== null && payload.amount !== "") {
      payload.amount = Number(payload.amount);
    }

    // If it's not a gift, payment isn't required.
    if (payload.method !== "gift") {
      payload.paymentStatus = "not_required";
      payload.transactionId = undefined;
      payload.paidAt = undefined;
    }

    const sponsor = await Sponsor.create(payload);
    res.status(201).json({ success: true, data: sponsor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create sponsor", error: err });
  }
};


export const getAllSponsor = async (req, res) => {
  try {
    const search = req.query.search || "";
    const method = req.query.method || "";
    const sponsorType = req.query.sponsorType || "";
    const paymentStatus = req.query.paymentStatus || "";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { organization: { $regex: search, $options: "i" } },
        { sponsorTarget: { $regex: search, $options: "i" } },
      ];
    }

    if (method) filter.method = method;
    if (sponsorType) filter.sponsorType = sponsorType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        // include the full end date day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const total = await Sponsor.countDocuments(filter);
    const sponsor = await Sponsor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: sponsor,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get sponsor" });
  }
};


export const deleteSponsor = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSponsor = await Sponsor.findByIdAndDelete(id);

    if (!deletedSponsor) {
      return res
        .status(404)
        .send({ success: false, message: "Sponsor not found." });
    }
    res
      .status(200)
      .send({ success: true, message: "Sponsor deleted successfully." });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error.", error });
  }
};



export const processSponsorPayment = async (req, res) => {
  try {
    const { sponsorData, payment } = req.body || {};
    const { cardNumber, expiryMonth, expiryYear, cvv, amount } = payment || {};

    if (!sponsorData) {
      return res.status(400).json({ success: false, message: "Missing sponsorData", error: "Missing sponsorData" });
    }
    if (!sponsorData.name || !sponsorData.email) {
      return res.status(400).json({ success: false, message: "Name and email are required.", error: "Name and email are required." });
    }
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
      return res.status(400).json({ success: false, message: "Missing card details", error: "Missing card details" });
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount", error: "Invalid amount" });
    }

    // The partner form has one "Full Name" field; LoveGift stores the parts.
    const fullName = String(sponsorData.name).trim();
    const spaceAt = fullName.indexOf(" ");
    const firstName = spaceAt === -1 ? fullName : fullName.slice(0, spaceAt);
    const lastName = spaceAt === -1 ? "" : fullName.slice(spaceAt + 1).trim();

    /*
      Designation works exactly as it does on the donate page: the station's
      general fund, or one named artist. The partner's Program/Individual choice
      is kept alongside as a label and has no say in where the money goes.

      The artist is resolved server-side; never trust a name posted by the
      browser. A request that names no artist — the mobile app sends none — falls
      back to the general fund rather than inventing a payable balance.
    */
    const recipientType = sponsorData.recipientType === "artist" ? "artist" : "station";

    let artist = null;
    if (recipientType === "artist") {
      if (!sponsorData.artistId) {
        return res.status(400).json({ success: false, message: "Please choose an artist.", error: "Please choose an artist." });
      }
      artist = await User.findOne({
        _id: sponsorData.artistId,
        role: "User",
        accountType: "seller",
        sellerApprovalStatus: "approved",
      }).select("_id name email username");

      if (!artist) {
        return res.status(400).json({ success: false, message: "That artist is not available.", error: "That artist is not available." });
      }
    }

    const gift = await LoveGift.create({
      firstName,
      lastName,
      email: String(sponsorData.email).trim().toLowerCase(),
      phone: sponsorData.phone || "",
      organization: sponsorData.organization || "",
      amount: amountNum,
      comment: sponsorData.comment || "",
      source: "partner",
      recipientType,
      partnerType: sponsorData.sponsorType || "",
      partnerTarget: String(sponsorData.sponsorTarget || "").trim(),
      artist: artist?._id || null,
      artistName: artist?.name || "",
      artistEmail: artist?.email || "",
      artistUsername: artist?.username || "",
      paymentStatus: "pending",
    });

    const result = await chargeCard({ cardNumber, expiryMonth, expiryYear, cvv, amount: amountNum });

    if (!result.success) {
      // A held transaction is not a decline — leave it pending so the admin
      // follows it up in Authorize.Net rather than seeing it written off.
      await LoveGift.findByIdAndUpdate(gift._id, {
        paymentStatus: result.held ? "pending" : "failed",
        failureReason: result.error || "Payment failed",
        transactionId: result.transactionId || undefined,
      });
      const message = result.error || "Payment failed";
      return res.status(502).json({ success: false, message, error: message });
    }

    const paid = await LoveGift.findByIdAndUpdate(
      gift._id,
      { paymentStatus: "paid", transactionId: result.transactionId, paidAt: new Date() },
      { new: true }
    );

    const donorName = `${paid.firstName} ${paid.lastName}`.trim();
    /*
      Name the handle wherever the admin reads who a gift was for — it is the
      only thing that separates two artists sharing a display name, and this
      notification is the first place the admin sees the gift.
    */
    const artistLabel = artist
      ? `${artist.name}${artist.username ? ` (@${artist.username})` : ` (ID ${String(artist._id).slice(-6)})`}`
      : "";
    const designation = artist ? `for ${artistLabel}` : "for the station";

    await notifyAdmin({
      type: "love_gift_received",
      title: `Partner Love Gift received ${designation}`,
      message: `${donorName} gave $${amountNum.toFixed(2)} ${designation}.`,
      refId: paid._id,
      refModel: "LoveGift",
      actorName: donorName,
      actorEmail: paid.email,
    });

    /*
      Tell the artist a gift came in — without the amount, matching the donate
      page. The station collects the money and decides each payout separately.
    */
    if (artist) {
      await notifyUser({
        userId: artist._id,
        type: "gift_received_artist",
        title: "Someone sent you a Love Gift",
        message: `${donorName} gave a Love Gift in your name${paid.comment ? ` — "${paid.comment}"` : ""}.`,
        refId: paid._id,
        refModel: "LoveGift",
        actorName: donorName,
      });
    }

    try {
      await sendEmail({
        to: paid.email,
        subject: "Thank you for your Love Gift",
        html: `Hello ${donorName},<br><br>
Thank you for partnering with HG Radio Station.<br><br>
Amount: $${amountNum.toFixed(2)}<br>
${designation ? `Designated: ${designation}<br>` : ""}
Transaction ID: ${result.transactionId}<br>
Date: ${new Date().toLocaleDateString()}<br><br>
With gratitude,<br>
The HG Radio Station Team`,
      });
    } catch (e) {
      console.error("Partner Love Gift receipt email failed:", e?.message || e);
    }

    return res.status(200).json({
      success: true,
      transactionId: result.transactionId,
      data: paid,
      gift: paid,
    });
  } catch (error) {
    console.error("processSponsorPayment error:", error?.message || error);
    const message = error?.message || "Server error";
    return res.status(500).json({ success: false, message, error: message });
  }
};
