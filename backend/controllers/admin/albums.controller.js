import Album from "../../models/album.model.js";
import Notification from "../../models/notification.model.js";
import { sendEmail } from "../../utils/util.js";

const parseStatus = (value) => {
  const s = String(value || "").toLowerCase();
  return ["pending", "approved", "rejected"].includes(s) ? s : "pending";
};

// GET /api/admin/albums?status=pending&page=1&limit=20&q=
export const adminListAlbums = async (req, res) => {
  try {
    const status = req.query.status ? parseStatus(req.query.status) : null;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const q = req.query.q ? String(req.query.q).trim() : "";

    const filter = {};
    if (status) filter.approvalStatus = status;

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
      ];
    }

    const [total, albums] = await Promise.all([
      Album.countDocuments(filter),
      Album.find(filter)
        .populate("artist", "name email")
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
      albums,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch albums",
      error: error.message,
    });
  }
};

// GET /api/admin/albums/:albumId
export const adminGetAlbumById = async (req, res) => {
  try {
    const { albumId } = req.params;
    const album = await Album.findById(albumId).populate("artist", "name email");
    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }
    return res.status(200).json({ success: true, album });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch album",
      error: error.message,
    });
  }
};

// PATCH /api/admin/albums/:albumId/approve
export const adminApproveAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;
    const album = await Album.findById(albumId).populate("artist", "name email");
    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    album.approvalStatus = "approved";
    album.approvalReason = "";
    album.approvedAt = new Date();
    await album.save();

    // Notify artist
    try {
      if (album.artist?.email) {
        await sendEmail({
          to: album.artist.email,
          subject: "Your Album Has Been Approved",
          html: `<p>Hello ${album.artist.name || ""},</p><p>Great news! Your album <strong>${album.title}</strong> has been approved and is now live.</p>`,
        });
      }
    } catch (e) {
      console.error("Album approval email failed:", e?.message || e);
    }

    // Create admin notification
    try {
      await Notification.create({
        type: "album_approved",
        title: `Album Approved: ${album.title}`,
        message: `Artist: ${album.artist?.name || "Unknown"} — Album "${album.title}" has been approved.`,
        refId: album._id,
        refModel: "Album",
      });
    } catch (e) { console.error("Notification create failed:", e?.message || e); }

    return res.status(200).json({ success: true, message: "Album approved", album });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to approve album",
      error: error.message,
    });
  }
};

// PATCH /api/admin/albums/:albumId/reject
export const adminRejectAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;
    const { reason } = req.body || {};
    const cleanReason = String(reason || "").trim();
    if (!cleanReason) {
      return res.status(400).json({ success: false, message: "Reason is required." });
    }

    const album = await Album.findById(albumId).populate("artist", "name email");
    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    album.approvalStatus = "rejected";
    album.approvalReason = cleanReason;
    await album.save();

    // Notify artist
    try {
      if (album.artist?.email) {
        await sendEmail({
          to: album.artist.email,
          subject: "Your Album Submission Was Rejected",
          html: `<p>Hello ${album.artist.name || ""},</p><p>Your album <strong>${album.title}</strong> has been rejected.</p><p><strong>Reason:</strong> ${cleanReason}</p><p>Please contact the admin for more information.</p>`,
        });
      }
    } catch (e) {
      console.error("Album rejection email failed:", e?.message || e);
    }

    // Create admin notification
    try {
      await Notification.create({
        type: "album_rejected",
        title: `Album Rejected: ${album.title}`,
        message: `Artist: ${album.artist?.name || "Unknown"} — Album "${album.title}" was rejected. Reason: ${cleanReason}`,
        refId: album._id,
        refModel: "Album",
      });
    } catch (e) { console.error("Notification create failed:", e?.message || e); }

    return res.status(200).json({ success: true, message: "Album rejected", album });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reject album",
      error: error.message,
    });
  }
};
