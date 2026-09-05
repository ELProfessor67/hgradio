import Setting from "../../models/setting.model.js";



// GET /api/admin/settings
export const adminGetSettings = async (req, res) => {
  try {
    const settings = await Setting.getGlobal();
    return res.status(200).json({
      success: true,
      settings: { serviceFeePercent: settings.serviceFeePercent },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load settings",
      error: error.message,
    });
  }
};

// PATCH /api/admin/settings  { serviceFeePercent }
export const adminUpdateSettings = async (req, res) => {
  try {
    const { serviceFeePercent } = req.body || {};
    const settings = await Setting.getGlobal();

    if (serviceFeePercent !== undefined) {
      const pct = Number(serviceFeePercent);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({
          success: false,
          message: "Service fee must be a number between 0 and 100.",
        });
      }
      settings.serviceFeePercent = pct;
    }

    settings.updatedBy = req.user?.id;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings saved",
      settings: { serviceFeePercent: settings.serviceFeePercent },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save settings",
      error: error.message,
    });
  }
};
