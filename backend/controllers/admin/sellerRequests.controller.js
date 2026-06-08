import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";
import { sendEmail } from "../../utils/util.js";
import { syncPlaylist } from "../../utils/hgdjSync.js";

const parseStatus = (value) => {
  const s = String(value || "").toLowerCase();
  return ["pending", "approved", "rejected"].includes(s) ? s : "pending";
};

export const adminListSellerRequests = async (req, res) => {
  try {
    const status = parseStatus(req.query.status);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const q = req.query.q ? String(req.query.q).trim() : "";

    const filter = {
      role: "User",
      accountType: "seller",
      sellerApprovalStatus: status,
    };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-password -resetPasswordToken -resetPasswordExpire -albumOtpHash -albumOtpExpiresAt")
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
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller requests",
      error: error.message,
    });
  }
};

export const adminGetSellerRequestById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select(
      "-password -resetPasswordToken -resetPasswordExpire -albumOtpHash -albumOtpExpiresAt"
    );

    if (!user || user.role !== "User" || user.accountType !== "seller") {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller",
      error: error.message,
    });
  }
};

export const adminApproveSeller = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id;

    const user = await User.findById(userId);
    if (!user || user.role !== "User" || user.accountType !== "seller") {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    user.sellerApprovalStatus = "approved";
    user.sellerApprovalReason = "";
    user.sellerReviewedAt = new Date();
    user.sellerReviewedBy = adminId;
    await user.save();

    // Sync artist playlist to HGDJLive (fail-safe)
    try {
      await syncPlaylist({
        _id:         String(user._id),
        title:       user.name || "Artist",
        description: `Playlist for artist: ${user.name || user.email}`,
        artist:      user.name || "",
        isTemp:      false,
      });
    } catch (e) {
      console.error("[adminApproveSeller] HGDJLive playlist sync failed:", e?.message || e);
    }

    // Notify seller via email
    try {
      const artistName = user.name || "Artist";
      const dashboardLink = `${process.env.FRONTEND_URL || "https://hgcradio.org"}/dashboard/${user._id}`;
      await sendEmail({
        to: user.email,
        subject: "🎉 Your HGCRadio Seller Account Has Been Approved!",
        html: `Dear ${artistName},

🎉 Congratulations!

We are pleased to inform you that your seller account on HGCRadio has been successfully reviewed and approved by our admin team.

Your contract has been accepted, and your account is now fully activated. You can start adding and managing your albums right away.

To get started, please visit your dashboard and navigate to your album page:
${dashboardLink}

We're excited to have you onboard and look forward to your contributions to the Kingdom through your music.

If you have any questions or need assistance, feel free to contact our support team at: support@hgcradio.org

Best regards,
HGCRadio Team
hgcradio.org · support@hgcradio.org`,
      });
    } catch (e) {
      // Don't fail the approval if email fails
      console.error("Approval email failed:", e?.message || e);
    }

    // Create admin notification
    try {
      await Notification.create({
        type: "seller_approved",
        title: `Artist Approved: ${user.name || user.email}`,
        message: `Seller account for "${user.name || user.email}" has been approved.`,
        refId: user._id,
        refModel: "User",
      });
    } catch (e) { console.error("Notification create failed:", e?.message || e); }

    return res.status(200).json({
      success: true,
      message: "Seller approved",
      user: await User.findById(user._id).select("-password"),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to approve seller",
      error: error.message,
    });
  }
};

export const adminRejectSeller = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body || {};
    const adminId = req.user?.id;

    const cleanReason = String(reason || "").trim();
    if (!cleanReason) {
      return res.status(400).json({ success: false, message: "Reason is required." });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "User" || user.accountType !== "seller") {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    user.sellerApprovalStatus = "rejected";
    user.sellerApprovalReason = cleanReason;
    user.sellerReviewedAt = new Date();
    user.sellerReviewedBy = adminId;
    await user.save();

    // Notify seller via email
    try {
      const artistName = user.name || "Artist";
      await sendEmail({
        to: user.email,
        subject: "Update on Your HGCRadio Seller Account Application",
        html: `Dear ${artistName},

Thank you for your interest in becoming a seller on HGCRadio.

After careful review, we regret to inform you that your contract submission has not been approved at this time.

Reason for Rejection:
${cleanReason}

We encourage you to review the feedback provided above and make the necessary updates if you wish to reapply.

If you have any questions or need further clarification, please don't hesitate to reach out to our support team at: support@hgcradio.org

Thank you for your understanding.

Best regards,
HGCRadio Team
hgcradio.org · support@hgcradio.org`,
      });
    } catch (e) {
      console.error("Rejection email failed:", e?.message || e);
    }

    // Create admin notification
    try {
      await Notification.create({
        type: "seller_rejected",
        title: `Artist Rejected: ${user.name || user.email}`,
        message: `Seller account for "${user.name || user.email}" was rejected. Reason: ${cleanReason}`,
        refId: user._id,
        refModel: "User",
      });
    } catch (e) { console.error("Notification create failed:", e?.message || e); }

    return res.status(200).json({
      success: true,
      message: "Seller rejected",
      user: await User.findById(user._id).select("-password"),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reject seller",
      error: error.message,
    });
  }
};


