import User from "../../models/user.model.js";
import WithdrawRequest from "../../models/withdrawRequest.model.js";
import { notifyUser, resolveAdminNotifications } from "../../utils/notify.js";
import { sendEmail } from "../../utils/util.js";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
};

export const adminListWithdrawRequests = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const status = req.query.status ? String(req.query.status) : "";
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    const q = req.query.q ? String(req.query.q).trim() : "";
    const userId = req.query.userId ? String(req.query.userId) : "";

    const filter = {};

    if (status && ["pending", "processing", "completed"].includes(status)) {
      filter.status = status;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    if (userId) {
      filter.user = userId;
    }

    if (q && !userId) {
      const users = await User.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      })
        .select("_id")
        .limit(50);

      const ids = users.map((u) => u._id);
      filter.user = { $in: ids.length ? ids : ["000000000000000000000000"] };
    }

    const [total, requests] = await Promise.all([
      WithdrawRequest.countDocuments(filter),
      WithdrawRequest.find(filter)
        .populate("user", "_id name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.status(200).send({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      requests,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to fetch withdraw requests",
      error: error.message,
    });
  }
};

export const adminUpdateWithdrawStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const status = String(req.body?.status || "").toLowerCase();

    if (!["pending", "processing", "completed"].includes(status)) {
      return res.status(400).send({
        success: false,
        message: "Invalid status. Use pending, processing, or completed.",
      });
    }

    const request = await WithdrawRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .send({ success: false, message: "Request not found" });
    }

    if (request.status === "completed" && status !== "completed") {
      return res.status(400).send({
        success: false,
        message: "Completed requests cannot be changed.",
      });
    }

    const prevStatus = request.status;
    request.status = status;

    if (status === "completed" && prevStatus !== "completed") {
      request.completedAt = new Date();
      await Promise.all([
        request.save(),
        User.findByIdAndUpdate(request.user, {
          $inc: { totalWithdrawn: Number(request.amount || 0) },
        }),
      ]);
    } else {
      await request.save();
    }

    const populated = await WithdrawRequest.findById(request._id).populate(
      "user",
      "_id name email"
    );

    /*
      Withdrawals used to change status silently — the artist had to keep
      opening the page to find out. Only real transitions notify, so re-saving
      the same status does not send a duplicate.
    */
    if (status !== prevStatus) {
      const artistEmail = populated?.user?.email || "";
      const artistName = populated?.user?.name || "";

      if (status === "processing") {
        await notifyUser({
          userId: request.user,
          type: "withdraw_processing",
          title: "Your withdrawal is being processed",
          message: `Your withdrawal of ${money(request.amount)} is on its way. This usually takes 1 to 2 days.`,
          refId: request._id,
          refModel: "WithdrawRequest",
        });

        try {
          if (artistEmail) {
            await sendEmail({
              to: artistEmail,
              subject: `Your withdrawal is being processed: ${money(request.amount)}`,
              html: `Hello ${artistName},<br><br>
Your withdrawal is being processed.<br><br>
Amount: ${money(request.amount)}<br>
Date: ${new Date().toLocaleDateString()}<br><br>
This usually takes 1 to 2 days. We will email you once it has been sent.<br><br>
The HG Radio Station Team`,
            });
          }
        } catch (e) {
          console.error("Withdraw processing email failed:", e?.message || e);
        }
      } else if (status === "completed") {
        await notifyUser({
          userId: request.user,
          type: "withdraw_completed",
          title: `Withdrawal sent: ${money(request.amount)}`,
          message: `Your withdrawal of ${money(request.amount)} has been completed.`,
          refId: request._id,
          refModel: "WithdrawRequest",
        });

        /*
          Resolved on completion rather than on "processing": until the money
          has actually been sent the request is still outstanding work, and the
          pending badge is what stops it being forgotten halfway through.
        */
        await resolveAdminNotifications(request._id, "WithdrawRequest");

        try {
          if (artistEmail) {
            await sendEmail({
              to: artistEmail,
              subject: `Withdrawal sent: ${money(request.amount)}`,
              html: `Hello ${artistName},<br><br>
Your withdrawal has been completed.<br><br>
Amount: ${money(request.amount)}<br>
Date: ${new Date().toLocaleDateString()}<br><br>
You can see this in your dashboard.<br><br>
The HG Radio Station Team`,
            });
          }
        } catch (e) {
          console.error("Withdraw completed email failed:", e?.message || e);
        }
      }
    }

    return res.status(200).send({
      success: true,
      message: "Status updated",
      request: populated,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to update withdraw status",
      error: error.message,
    });
  }
};


