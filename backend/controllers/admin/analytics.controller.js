import User from "../../models/user.model.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "User" });
    const totalSellers = await User.countDocuments({ accountType: "seller", role: "User" });
    const totalBuyers = await User.countDocuments({ accountType: "buyer", role: "User" });

    const sellerStatusStats = await User.aggregate([
      { $match: { accountType: "seller", role: "User" } },
      {
        $group: {
          _id: "$sellerApprovalStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    sellerStatusStats.forEach((stat) => {
      if (stat._id === "pending") stats.pending = stat.count;
      else if (stat._id === "approved") stats.approved = stat.count;
      else if (stat._id === "rejected") stats.rejected = stat.count;
    });

    // For graphs, let's get monthly registrations for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          role: "User"
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalBuyers,
        sellerStatus: stats,
        monthlyRegistrations: monthlyStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};
