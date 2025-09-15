import Contact from "../../models/contact.model.js";

export const createContact = async (req, res) => {
  try {

    const contact = await Contact.create(req.body);
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ message: "Failed to create contact", error: err });
  }
};


export const getAllContact = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      email: { $regex: search, $options: "i" },
    };

    const total = await Contact.countDocuments(filter);
    const contact = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      data: contact,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get contacts" });
  }
};


export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedContact = await Contact.findByIdAndDelete(id);

    if (!deletedContact) {
      return res
        .status(404)
        .send({ success: false, message: "Contact not found." });
    }
    res
      .status(200)
      .send({ success: true, message: "Contact deleted successfully." });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error.", error });
  }
};
