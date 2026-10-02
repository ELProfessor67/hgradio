import mongoose from "mongoose";
import User from "../../models/user.model.js";
import Album from "../../models/album.model.js";
import Playlist from "../../models/playlist.model.js";
import WithdrawRequest from "../../models/withdrawRequest.model.js";
import { sendEmail } from "../../utils/util.js";

/*
  Every account on the platform, in one list, with a take-down.

  Until now the admin panel could only see slices of the roster: sellers
  waiting on approval (seller-requests) and nothing else. There was no page
  that answered "who is on this site", and no way at all to remove an account
  — the one deleteUser route that existed is a self-service one on the user
  side, and it refuses anybody who isn't the account holder.
*/

/** The three buckets the panel filters by, expressed as Mongo filters. */
const ROLE_FILTERS = {
  admin: { role: "Admin" },
  artist: { role: "User", accountType: "seller" },
  buyer: { role: "User", accountType: "buyer" },
};

const SAFE_FIELDS =
  "-password -resetPasswordToken -resetPasswordExpire -albumOtpHash -albumOtpExpiresAt";

// GET /api/admin/users?role=all|admin|artist|buyer&q=&page=1&limit=20
export const adminListUsers = async (req, res) => {
  try {
    const role = String(req.query.role || "all").toLowerCase();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;
    const q = req.query.q ? String(req.query.q).trim() : "";

    const filter = { ...(ROLE_FILTERS[role] || {}) };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ];
    }

    const [total, users, counts] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).select(SAFE_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
      // Tab counts, so the panel can say how many of each there are without
      // the admin having to click through every filter to find out.
      Promise.all([
        User.countDocuments({}),
        User.countDocuments(ROLE_FILTERS.admin),
        User.countDocuments(ROLE_FILTERS.artist),
        User.countDocuments(ROLE_FILTERS.buyer),
      ]).then(([all, admin, artist, buyer]) => ({ all, admin, artist, buyer })),
    ]);

    // An artist row is more useful with their album count on it — it is the
    // thing that makes deleting them consequential.
    const artistIds = users.filter((u) => u.accountType === "seller").map((u) => u._id);
    const albumCounts = artistIds.length
      ? await Album.aggregate([
          { $match: { artist: { $in: artistIds } } },
          { $group: { _id: "$artist", count: { $sum: 1 } } },
        ])
      : [];
    const albumCountBy = new Map(albumCounts.map((r) => [String(r._id), r.count]));

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      counts,
      users: users.map((u) => ({
        ...u.toObject(),
        albumCount: albumCountBy.get(String(u._id)) || 0,
        purchaseCount: u.purchasedAlbums?.length || 0,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

/*
  DELETE /api/admin/users/:userId

  Deleting a person is not like deleting a testimonial — it can take albums,
  purchases and an unpaid balance down with them. So this refuses to go
  through blind:

    - Never the admin's own account. Deleting yourself mid-session locks you
      out of the panel you are standing in.
    - Never the last remaining admin, for the same reason one step removed:
      nobody would be able to get back in.
    - An account that owns albums, holds an unpaid balance, or has a pending
      withdrawal comes back 409 with the numbers spelled out, and only a
      second call with ?force=true proceeds. That is the "are you sure",
      enforced here rather than trusted to a dialog in the browser.
*/
export const adminDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const force = String(req.query.force || "") === "true";
    const adminId = req.user?.id;
    const reason = String(req.body?.reason || "").trim();

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }

    if (String(adminId) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "You can't delete your own admin account while you're signed in with it.",
      });
    }

    const user = await User.findById(userId).select(SAFE_FIELDS);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "Admin") {
      const adminCount = await User.countDocuments({ role: "Admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "This is the last admin account. Deleting it would leave nobody able to sign in to the panel.",
        });
      }
    }

    const [albumCount, pendingWithdrawals] = await Promise.all([
      Album.countDocuments({ artist: user._id }),
      WithdrawRequest.countDocuments({ user: user._id, status: { $in: ["pending", "processing"] } }),
    ]);
    const balance = Number(user.balance || 0);
    const purchaseCount = user.purchasedAlbums?.length || 0;

    if (!force && (albumCount > 0 || balance > 0 || pendingWithdrawals > 0 || purchaseCount > 0)) {
      const parts = [];
      if (albumCount > 0) parts.push(`${albumCount} album${albumCount === 1 ? "" : "s"} (which will also be removed from the site)`);
      if (purchaseCount > 0) parts.push(`${purchaseCount} purchased album${purchaseCount === 1 ? "" : "s"}`);
      if (balance > 0) parts.push(`an unpaid balance of $${balance.toFixed(2)}`);
      if (pendingWithdrawals > 0) parts.push(`${pendingWithdrawals} pending withdrawal request${pendingWithdrawals === 1 ? "" : "s"}`);

      return res.status(409).json({
        success: false,
        requiresForce: true,
        details: { albumCount, purchaseCount, balance, pendingWithdrawals },
        message: `${user.name || "This account"} has ${parts.join(", ")}. Deleting the account takes all of it with them.`,
      });
    }

    // Their albums go with them, and so do those albums' entries in anyone
    // else's library — otherwise buyers are left with cards pointing at
    // records that no longer exist.
    const ownedAlbumIds = albumCount > 0 ? (await Album.find({ artist: user._id }).select("_id")).map((a) => a._id) : [];
    if (ownedAlbumIds.length) {
      await Album.deleteMany({ _id: { $in: ownedAlbumIds } });
      await User.updateMany(
        { "purchasedAlbums.album": { $in: ownedAlbumIds } },
        { $pull: { purchasedAlbums: { album: { $in: ownedAlbumIds } } } }
      );
    }

    await Playlist.deleteMany({ owner: user._id });

    const name = user.name || user.email;

    /*
      The address is read off the document before it is deleted — afterwards
      there is nothing left to write to. The mail itself goes out after the
      delete has succeeded, so nobody is told their account is gone when it is
      in fact still there, and a mail failure cannot undo a completed removal.
    */
    const removalEmail = user.email;
    const removalName = user.name || "";

    await user.deleteOne();

    try {
      if (removalEmail) {
        await sendEmail({
          to: removalEmail,
          subject: "Your HGCRadio account has been removed",
          html: `Dear ${removalName || "User"},<br><br>
Your account on HGCRadio has been removed by our admin team.<br><br>
${reason ? `Reason:<br>${reason}<br><br>` : ""}
This means you no longer have access to the site${ownedAlbumIds.length ? ", and any albums you had published are no longer available" : ""}.<br><br>
If you believe this was a mistake, or you have questions about it, please contact our support team at: support@hgcradio.org<br><br>
The HG Radio Station Team`,
        });
      }
    } catch (e) {
      console.error("[adminDeleteUser] removal email failed:", e?.message || e);
    }

    /*
      Payout and withdrawal records are deliberately left in place. They are
      the history of money that moved, and an account being removed does not
      un-move it — the books have to still add up afterwards.
    */

    return res.status(200).json({
      success: true,
      message: `${name} was deleted.`,
      userId: String(userId),
      albumsRemoved: ownedAlbumIds.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};
