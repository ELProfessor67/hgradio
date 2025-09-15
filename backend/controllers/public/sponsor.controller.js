import Sponsor from "../../models/sponsor.model.js";

export const createSponsor = async (req, res) => {
  try {

    const sponsor = await Sponsor.create(req.body);
    res.status(201).json(sponsor);
  } catch (err) {
    res.status(500).json({ message: "Failed to create contact", error: err });
  }
};


export const getAllSponsor = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      email: { $regex: search, $options: "i" },
    };

    const total = await Sponsor.countDocuments(filter);
    const sponsor = await Sponsor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      data: sponsor,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get sponsor" });
  }
};


export const deleteSponsor = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSponsor= await Sponsor.findByIdAndDelete(id);

    if (!deletedSponsor) {
      return res
        .status(404)
        .send({ success: false, message: "Sponsor not found." });
    }
    res
      .status(200)
      .send({ success: true, message: "Sponsor deleted successfully." });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error.", error });
  }
};
