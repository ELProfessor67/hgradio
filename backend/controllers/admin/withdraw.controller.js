import User from "../../models/user.model.js";
import WithdrawRequest from "../../models/withdrawRequest.model.js";

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


