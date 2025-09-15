import User from "../../models/user.model.js";
import jwt from "jsonwebtoken"

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).send({ error: "User already exists" });
    }

    const user = await User.create({ name, email, password, role });

    const token = generateToken(user._id);

    const { password: _, ...userData } = user._doc;

    res.status(201).send({ success: true, user: userData, token });
  } catch (error) {
    res.status(500).send({ error: "Server error", details: error.message });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(email, password);
    
    const user = await User.findOne({ email, role: "Admin" }).select(
      "+password"
    );
    if (!user) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    const { password: _, ...userData } = user._doc;

    res.status(200).send({ success: true, user: userData, token });
  } catch (error) {
    res.status(500).send({ error: "Server error", details: error.message });
  }
};

export const getCurrentAdmin = async (req, res) => {
  const { adminId } = req.params;

  // console.log("hello");

  try {
    const user = await User.findById({ _id: adminId, role: "Admin" }).select(
      "-password -paymentIntentId"
    );

    // console.log(userId);

    if (!user) {
      return res.status(404).send({ error: "Admin not found" });
    }

    return res.status(200).send({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).send({
      error: "Server error",
      details: error.message,
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (req.user.id !== adminId) {
      return res.status(403).send({
        success: false,
        message: "Not authorized to delete this admin.",
      });
    }

    const deletedUser = await User.findByIdAndDelete({
      _id: adminId,
      role: "Admin",
    });

    if (!deletedUser) {
      return res
        .status(404)
        .send({ success: false, message: "Admin not found." });
    }

    res
      .status(200)
      .send({ success: true, message: "Admin deleted successfully." });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error.", error });
  }
};
