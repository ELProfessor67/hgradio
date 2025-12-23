import User from "../../models/user.model.js";
import { sendEmail } from "../../utils/util.js";

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

    // Notify seller via email
    try {
      await sendEmail({
        to: user.email,
        subject: "Seller Account Approved",
        html: `<p>Congratulations ${user.name || ""}! Your seller account has been approved. You can now add albums.</p>`,
      });
    } catch (e) {
      // Don't fail the approval if email fails
      console.error("Approval email failed:", e?.message || e);
    }

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
      await sendEmail({
        to: user.email,
        subject: "Seller Account Disapproved",
        html: `<p>Hello ${user.name || ""},</p><p>Your seller request has been disapproved.</p><p><strong>Reason:</strong> ${cleanReason}</p><p>Please contact the admin for help.</p>`,
      });
    } catch (e) {
      console.error("Rejection email failed:", e?.message || e);
    }

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


