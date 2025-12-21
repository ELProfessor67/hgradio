import User from "../../models/user.model.js";
import WithdrawRequest from "../../models/withdrawRequest.model.js";

const MIN_WITHDRAW_AMOUNT = 5;

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

    const user = await User.findById(userId).select("balance");
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


