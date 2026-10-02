import User from "../../models/user.model.js";
import WithdrawRequest from "../../models/withdrawRequest.model.js";
import { notifyAdmin } from "../../utils/notify.js";
import { sendEmail } from "../../utils/util.js";

const MIN_WITHDRAW_AMOUNT = 5;

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export const createWithdrawRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    const amount = Number(req.body?.amount);

    if (!userId) {
      return res.status(401).send({ success: false, message: "Unauthorized" });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).send({
        success: false,
        message: "amount must be a positive number.",
      });
    }

    if (amount < MIN_WITHDRAW_AMOUNT) {
      return res.status(400).send({
        success: false,
        message: `Minimum withdraw amount is $${MIN_WITHDRAW_AMOUNT}.`,
      });
    }

    const user = await User.findById(userId).select("balance name email");
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const balance = Number(user.balance || 0);
    if (amount > balance) {
      return res.status(400).send({
        success: false,
        message: "Insufficient balance.",
      });
    }

    // Deduct immediately (funds reserved for payout processing)
    user.balance = balance - amount;
    await user.save();

    const request = await WithdrawRequest.create({
      user: user._id,
      amount,
      status: "pending",
    });

    /*
      Withdrawals used to reach the admin panel silently: nothing raised a flag,
      so an artist's money sat waiting until somebody happened to open the page.
      This is the only inbound event that moves money out, so it is marked
      requiresAction and stays on the pending badge until it is paid out.
    */
    await notifyAdmin({
      type: "withdraw_requested",
      title: `Withdrawal requested: ${money(amount)}`,
      message: `${user.name || "An artist"} requested a withdrawal of ${money(amount)}.`,
      refId: request._id,
      refModel: "WithdrawRequest",
      actorName: user.name || "",
      actorEmail: user.email || "",
      requiresAction: true,
    });

    /*
      The balance has already been debited and the request is on the books, so a
      mail failure must not fail the request — it is confirmation, not the act.
    */
    try {
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: `Withdrawal request received: ${money(amount)}`,
          html: `Hello ${user.name || ""},<br><br>
We have received your withdrawal request.<br><br>
Amount: ${money(amount)}<br>
Date: ${new Date().toLocaleDateString()}<br>
Status: Pending<br><br>
This amount has been held from your balance and usually takes 1 to 2 days to process. We will email you again when it is on its way.<br><br>
The HG Radio Station Team`,
        });
      }
    } catch (e) {
      console.error("Withdraw request email failed:", e?.message || e);
    }

    return res.status(201).send({
      success: true,
      message: "Withdraw request submitted. It takes 1 to 2 days to process.",
      request,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to create withdraw request",
      error: error.message,
    });
  }
};

export const getMyWithdrawRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(401).send({ success: false, message: "Unauthorized" });
    }

    const filter = { user: userId };

    const [total, requests] = await Promise.all([
      WithdrawRequest.countDocuments(filter),
      WithdrawRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("amount status createdAt updatedAt completedAt"),
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


