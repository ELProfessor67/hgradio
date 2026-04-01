import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";
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
      const artistName = user.name || "Artist";
      const dashboardLink = `${process.env.FRONTEND_URL || "https://hgcradio.org"}/dashboard/${user._id}`;
      await sendEmail({
        to: user.email,
        subject: "🎉 Your HGCRadio Seller Account Has Been Approved!",
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Seller Account Approved</title>
</head>
<body style="margin:0;padding:0;background-color:#060f24;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060f24;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#071126;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#071126 0%,#0b1c3a 100%);padding:36px 40px;text-align:center;border-bottom:1px solid rgba(102,252,241,0.2);">
              <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:2px;color:#66FCF1;">HGCRadio</p>
              <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Hallelujah Gospel Globally</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;">Dear ${artistName},</p>

              <p style="margin:0 0 24px;font-size:18px;font-weight:600;color:#66FCF1;">🎉 Congratulations!</p>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                We are pleased to inform you that your seller account on <strong style="color:#ffffff;">HGCRadio</strong> has been successfully reviewed and <strong style="color:#4ade80;">approved</strong> by our admin team.
              </p>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                Your contract has been accepted, and your account is now <strong style="color:#ffffff;">fully activated</strong>. You can start adding and managing your albums right away.
              </p>

              <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                To get started, please visit your dashboard and navigate to your album page:
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="border-radius:8px;background-color:#66FCF1;">
                    <a href="${dashboardLink}" target="_blank"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#060f24;text-decoration:none;border-radius:8px;letter-spacing:0.5px;">
                      Go to My Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                We're excited to have you onboard and look forward to your contributions to the Kingdom through your music.
              </p>

              <p style="margin:0;font-size:15px;line-height:1.7;color:#cbd5e1;">
                If you have any questions or need assistance, feel free to contact our support team at:<br/>
                <a href="mailto:support@hgcradio.org" style="color:#66FCF1;font-weight:600;text-decoration:none;">support@hgcradio.org</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Best regards,</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#94a3b8;">HGCRadio Team</p>
              <p style="margin:8px 0 0;font-size:12px;color:#475569;">
                <a href="https://hgcradio.org" style="color:#66FCF1;text-decoration:none;">hgcradio.org</a>
                &nbsp;·&nbsp;
                <a href="mailto:support@hgcradio.org" style="color:#66FCF1;text-decoration:none;">support@hgcradio.org</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
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
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Seller Account Application Update</title>
</head>
<body style="margin:0;padding:0;background-color:#060f24;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060f24;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#071126;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#071126 0%,#0b1c3a 100%);padding:36px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
              <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:2px;color:#66FCF1;">HGCRadio</p>
              <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Hallelujah Gospel Globally</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;">Dear ${artistName},</p>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                Thank you for your interest in becoming a seller on <strong style="color:#ffffff;">HGCRadio</strong>.
              </p>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                After careful review, we regret to inform you that your contract submission has <strong style="color:#f87171;">not been approved</strong> at this time.
              </p>

              <!-- Rejection Reason Box -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
                <tr>
                  <td style="background-color:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:1px;">Reason for Rejection</p>
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#e2e8f0;">${cleanReason}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                We encourage you to review the feedback provided above and make the necessary updates if you wish to reapply.
              </p>

              <p style="margin:0;font-size:15px;line-height:1.7;color:#cbd5e1;">
                If you have any questions or need further clarification, please don't hesitate to reach out to our support team at:<br/>
                <a href="mailto:support@hgcradio.org" style="color:#66FCF1;font-weight:600;text-decoration:none;">support@hgcradio.org</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Thank you for your understanding.</p>
              <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Best regards,</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#94a3b8;">HGCRadio Team</p>
              <p style="margin:8px 0 0;font-size:12px;color:#475569;">
                <a href="https://hgcradio.org" style="color:#66FCF1;text-decoration:none;">hgcradio.org</a>
                &nbsp;·&nbsp;
                <a href="mailto:support@hgcradio.org" style="color:#66FCF1;text-decoration:none;">support@hgcradio.org</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
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


