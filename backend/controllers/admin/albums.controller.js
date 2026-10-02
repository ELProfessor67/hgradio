import Album from "../../models/album.model.js";
import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";
import { sendEmail } from "../../utils/util.js";
import { syncAlbumToHGDJ } from "../../utils/hgdjSync.js";
import { notifyUser, resolveAdminNotifications } from "../../utils/notify.js";

const parseStatus = (value) => {
  const s = String(value || "").toLowerCase();
  return ["pending", "approved", "rejected"].includes(s) ? s : "pending";
};

// POST /api/admin/albums/sync-hgdj        → every approved album
// POST /api/admin/albums/:albumId/sync-hgdj → one album
//
// The DJ panel copy is only pushed at approve time, so albums approved while the
// sync was broken (or before it existed) never reached it and cannot be
// re-approved. This re-runs the sync on demand.
export const adminSyncAlbumsToHGDJ = async (req, res) => {
  try {
    const { albumId } = req.params;

    const filter = albumId
      ? { _id: albumId }
      : { approvalStatus: "approved" };

    const albums = await Album.find(filter).populate("artist", "name");

    if (albums.length === 0) {
      return res.status(404).json({
        success: false,
        message: albumId ? "Album not found" : "No approved albums to sync",
      });
    }

    const results = [];
    for (const album of albums) {
      if (album.approvalStatus !== "approved") {
        results.push({
          albumId: String(album._id),
          title: album.title,
          skipped: `not approved (${album.approvalStatus})`,
        });
        continue;
      }

      const outcome = await syncAlbumToHGDJ(album, album.artist?.name || "");
      results.push({
        albumId: String(album._id),
        title: album.title,
        ...outcome,
      });
    }

    const okCount = results.filter((r) => r.playlist && !r.failed).length;
    const failedCount = results.filter((r) => r.playlist === false || r.failed > 0).length;

    console.log(
      `[adminSyncAlbumsToHGDJ] ${okCount} album(s) synced, ${failedCount} with problems`
    );

    return res.status(200).json({
      success: true,
      message: `${okCount} album(s) synced to the DJ panel${
        failedCount ? `, ${failedCount} had problems` : ""
      }.`,
      total: results.length,
      okCount,
      failedCount,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to sync albums",
      error: error.message,
    });
  }
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

    // Push the album into the HGC DJ panel / Go Live library (fail-safe)
    let djSync = null;
    try {
      const artistName = album.artist?.name || "";
      djSync = await syncAlbumToHGDJ(album, artistName);
      if (!djSync.playlist || djSync.failed > 0) {
        console.warn(
          `[adminApproveAlbum] HGDJLive sync incomplete for ${album._id}:`,
          djSync
        );
      }
    } catch (e) {
      console.error("[adminApproveAlbum] HGDJLive sync failed:", e?.message || e);
    }

    // Notify artist
    try {
      if (album.artist?.email) {
        await sendEmail({
          to: album.artist.email,
          subject: "Your Album Has Been Approved",
          html: `Hello ${album.artist.name || ""},Great news! Your album ${album.title} has been approved and is now live.`,
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

    // The artist's own copy — the block above has no recipient, so it only
    // reaches the admin feed.
    await notifyUser({
      userId: album.artist?._id || album.artist,
      type: "album_approved",
      title: "Your album was approved",
      message: `"${album.title}" is now live on the site.`,
      refId: album._id,
      refModel: "Album",
    });

    await resolveAdminNotifications(album._id, "Album");

    return res.status(200).json({ success: true, message: "Album approved", album, djSync });
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
          html: `Hello ${album.artist.name || ""},Your album ${album.title} has been rejected. Reason: ${cleanReason} Please contact the admin for more information.`,
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

    await notifyUser({
      userId: album.artist?._id || album.artist,
      type: "album_rejected",
      title: "Your album was not approved",
      message: `"${album.title}" was rejected. Reason: ${cleanReason}`,
      refId: album._id,
      refModel: "Album",
    });

    await resolveAdminNotifications(album._id, "Album");

    return res.status(200).json({ success: true, message: "Album rejected", album });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reject album",
      error: error.message,
    });
  }
};

/*
  DELETE /api/admin/albums/:albumId — the admin's own take-down.

  Unlike the artist route this can remove a sold album, but never by accident:
  when buyers exist the first call comes back 409 with the buyer count so the
  UI can say who loses access, and only a repeat call with ?force=true goes
  through. That is the "are you sure" the client asked for, enforced on the
  server rather than trusted to a dialog in the browser.
*/
export const adminDeleteAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;
    const force = String(req.query.force || "") === "true";

    const album = await Album.findById(albumId).populate("artist", "name email");
    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    const buyerCount = await User.countDocuments({ "purchasedAlbums.album": album._id });
    if (buyerCount > 0 && !force) {
      return res.status(409).json({
        success: false,
        requiresForce: true,
        buyerCount,
        message: `${buyerCount} listener${buyerCount === 1 ? " has" : "s have"} purchased "${album.title}". Deleting it removes their access.`,
      });
    }

    const title = album.title;
    const artistId = album.artist?._id || album.artist;
    await album.deleteOne();

    // The buyers' library entries point at an album that no longer exists;
    // drop those rows so nothing renders a dead card.
    if (buyerCount > 0) {
      await User.updateMany(
        { "purchasedAlbums.album": albumId },
        { $pull: { purchasedAlbums: { album: albumId } } }
      );
    }

    try {
      await notifyUser({
        userId: artistId,
        type: "album_removed",
        title: "An album was removed",
        message: `"${title}" was removed from the site by an administrator.`,
        refModel: "Album",
      });
    } catch (e) {
      console.error("[adminDeleteAlbum] artist notify failed:", e?.message || e);
    }

    try {
      const artistEmail = album.artist?.email;
      if (artistEmail) {
        await sendEmail({
          to: artistEmail,
          subject: `Your album was removed: ${title}`,
          html: `Hello ${album.artist?.name || ""},<br><br>
Your album <strong>${title}</strong> has been removed from HGCRadio by an administrator.<br><br>
It is no longer listed on the site${buyerCount > 0 ? `, and it has been removed from the libraries of the ${buyerCount} listener${buyerCount === 1 ? "" : "s"} who bought it` : ""}.<br><br>
If you have questions about this, please contact our support team at: support@hgcradio.org<br><br>
The HG Radio Station Team`,
        });
      }
    } catch (e) {
      console.error("[adminDeleteAlbum] removal email failed:", e?.message || e);
    }

    try {
      await resolveAdminNotifications(albumId, "Album");
    } catch (e) {
      console.error("[adminDeleteAlbum] notification cleanup failed:", e?.message || e);
    }

    return res.status(200).json({
      success: true,
      message: `"${title}" was removed.`,
      albumId: String(albumId),
      buyersAffected: buyerCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove album",
      error: error.message,
    });
  }
};
