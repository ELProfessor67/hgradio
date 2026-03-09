import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../utils/util.js";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";
import RegistrationOtp from "../../models/registrationOtp.model.js";
import UpgradeOtp from "../../models/upgradeOtp.model.js";

const REGISTER_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REGISTER_OTP_MIN_RESEND_SECONDS = 60;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const generateSixDigitOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const hashRegisterOtp = ({ email, otp }) => {
  const secret = process.env.JWT_SECRET || "fallback_secret";
  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${String(otp).trim()}:${secret}`)
    .digest("hex");
};

const sendOtpEmailViaMailer = async ({ email, otp }) => {
  // Keep consistent with existing album-otp mailer approach
  const resp = await fetch("https://mailing.hgcradio.org/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      subject: "Verify OTP",
      message: `Your OTP is> ${otp}`,
    }),
  });

  if (!resp.ok) {
    let details = "";
    try {
      details = await resp.text();
    } catch {
      // ignore
    }
    throw new Error(`Failed to send OTP email. ${details}`);
  }
};


const sendResetPasswordEmailViaMailer = async ({ email, resetUrl }) => {
  const resp = await fetch("https://mailing.hgcradio.org/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, subject: "Reset Your Password", message: `Click ${resetUrl} to reset your password.` }),
  });

  if (!resp.ok) {
    let details = "";
    try {
      details = await resp.text();
    } catch {
      // ignore
    }
    throw new Error(`Failed to send OTP email. ${details}`);
  }
};


export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      country,
      city,
      state,
      zipCode,
      accountType,
      otpToken,
      // Consent / release form fields
      initialGrantAuthorization,
      initialOwnershipRepresentation,
      initialLicensingProtection,
      initialAffiliateUse,
      initialWaiverCompensation,
      initialWarranties,
      initialIndemnification,
      initialPublicityPromotion,
      initialLimitationLiability,
      initialArbitrationVenue,
      initialGoverningLaw,
      initialCoverageFullWorks,
      initialEntireAgreement,
      copyrightOwnerName,
      copyrightOwnerSignature,
      copyrightOwnerDate,
      labelRepresentativeName,
      labelRepresentativeSignature,
      labelRepresentativeDate,

      digitalDistributionArtistName,
      digitalDistributionArtistSignature,
      digitalDistributionArtistDate,
      digitalDistributionRepName,
      digitalDistributionRepTitle,
      digitalDistributionRepSignature,
      digitalDistributionRepDate,
      digitalDistributionDigitalStoreOption,
      digitalDistributionSummaryName,
      digitalDistributionSummarySignature,
      digitalDistributionSummaryDate,
    } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).send({
        error: "Name, email, and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const effectiveAccountType =
      accountType === "seller" || accountType === "buyer" ? accountType : "buyer";

    if (effectiveAccountType === "seller") {
      if (!otpToken) {
        return res.status(400).send({
          error: "OTP verification required for seller registration",
        });
      }

      try {
        const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
        if (
          !decoded ||
          decoded.purpose !== "register_seller" ||
          normalizeEmail(decoded.email) !== normalizedEmail
        ) {
          return res.status(400).send({ error: "Invalid OTP token" });
        }
      } catch (err) {
        return res.status(400).send({ error: "Invalid or expired OTP token" });
      }
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).send({ error: "User already exists" });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      country,
      city,
      state,
      zipCode,
      role: "User",
      accountType: effectiveAccountType,
      sellerApprovalStatus: effectiveAccountType === "seller" ? "pending" : "not_required",

      initialGrantAuthorization,
      initialOwnershipRepresentation,
      initialLicensingProtection,
      initialAffiliateUse,
      initialWaiverCompensation,
      initialWarranties,
      initialIndemnification,
      initialPublicityPromotion,
      initialLimitationLiability,
      initialArbitrationVenue,
      initialGoverningLaw,
      initialCoverageFullWorks,
      initialEntireAgreement,
      copyrightOwnerName,
      copyrightOwnerSignature,
      copyrightOwnerDate,
      labelRepresentativeName,
      labelRepresentativeSignature,
      labelRepresentativeDate,

      digitalDistributionArtistName,
      digitalDistributionArtistSignature,
      digitalDistributionArtistDate,
      digitalDistributionRepName,
      digitalDistributionRepTitle,
      digitalDistributionRepSignature,
      digitalDistributionRepDate,
      digitalDistributionDigitalStoreOption,
      digitalDistributionSummaryName,
      digitalDistributionSummarySignature,
      digitalDistributionSummaryDate,
    });

    const token = generateToken(user._id);

    const { password: _, ...userData } = user._doc;

    res.status(201).send({ success: true, user: userData, token });
  } catch (error) {
    res.status(500).send({ error: "Server error", details: error.message });
  }
};

export const requestRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists." });
    }

    const existing = await RegistrationOtp.findOne({ email: normalizedEmail });
    if (existing?.lastSentAt) {
      const diffSeconds = (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
      if (diffSeconds < REGISTER_OTP_MIN_RESEND_SECONDS) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            REGISTER_OTP_MIN_RESEND_SECONDS - diffSeconds
          )}s before requesting another OTP.`,
        });
      }
    }

    const otp = generateSixDigitOtp();
    const otpHash = hashRegisterOtp({ email: normalizedEmail, otp });
    const expiresAt = new Date(Date.now() + REGISTER_OTP_TTL_MS);

    await RegistrationOtp.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otpHash, expiresAt, lastSentAt: new Date(), attempts: 0 },
      { upsert: true, new: true }
    );

    console.log(otp)

    await sendOtpEmailViaMailer({ email: normalizedEmail, otp });

    return res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", details: error.message });
  }
};

export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!otp || String(otp).trim().length === 0) {
      return res.status(400).json({ success: false, message: "OTP is required." });
    }

    const record = await RegistrationOtp.findOne({ email: normalizedEmail });
    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not found. Request a new OTP." });
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      await RegistrationOtp.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ success: false, message: "OTP expired. Request a new OTP." });
    }

    const providedHash = hashRegisterOtp({ email: normalizedEmail, otp: String(otp).trim() });
    if (providedHash !== record.otpHash) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    await RegistrationOtp.deleteOne({ email: normalizedEmail });

    const token = jwt.sign(
      { email: normalizedEmail, purpose: "register_seller" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({ success: true, message: "OTP verified.", otpToken: token });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", details: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    if (user.role !== "User") {
      return res.status(403).send({ error: "Access denied for this role" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const parser = new UAParser(req.headers["user-agent"]);
    const deviceInfo = parser.getResult();

    user.lastLoginIp = ip;
    user.lastLoginAt = new Date();
    user.device = deviceInfo.device.type || "Desktop";

    await user.save();
    // user.deviceInfo = {
    //   browser: deviceInfo.browser.name,
    //   os: deviceInfo.os.name,
    //   device: deviceInfo.device.type || "Desktop",
    // };

    // console.log(ip);
    // console.log(deviceInfo);

    const token = generateToken(user._id);

    const { password: _, ...userData } = user._doc;

    res.status(200).send({ success: true, user: userData, token });
  } catch (error) {
    res.status(500).send({ error: "Server error", details: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select(
      "-password -paymentIntentId"
    );

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const remainingDays = calculateRemainingPlanDays(user);

    if (user.isPlanActive && remainingDays === 0) {
      user.isPlanActive = false;
      user.planDuration = 0;
      await user.save();
    }

    const userObj = user.toObject();
    userObj.remainingDays = remainingDays;

    return res.status(200).send({
      success: true,
      user: userObj,
    });
  } catch (error) {
    return res.status(500).send({
      error: "Server error",
      details: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).send({
        success: false,
        message: "Not authorized to delete this user.",
      });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res
        .status(404)
        .send({ success: false, message: "User not found." });
    }

    res
      .status(200)
      .send({ success: true, message: "User deleted successfully." });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error.", error });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash it before saving to DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token & expiry in DB
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Create frontend reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    try {
      await sendResetPasswordEmailViaMailer({ email: user.email, resetUrl });
      return res.status(200).send({ success: true, message: "Reset link sent to email." });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).send({ success: false, message: "Server error" });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpire");;

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);
    user.password = password;

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successful." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============ UPGRADE TO SELLER FLOW ============

export const requestUpgradeOtp = async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    // Check if user exists and is a buyer
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.accountType !== "buyer") {
      return res.status(400).json({ 
        success: false, 
        message: "Only buyer accounts can upgrade to seller." 
      });
    }

    // Check rate limiting
    const existing = await UpgradeOtp.findOne({ email: normalizedEmail });
    if (existing?.lastSentAt) {
      const diffSeconds = (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
      if (diffSeconds < REGISTER_OTP_MIN_RESEND_SECONDS) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            REGISTER_OTP_MIN_RESEND_SECONDS - diffSeconds
          )}s before requesting another OTP.`,
        });
      }
    }

    const otp = generateSixDigitOtp();
    const otpHash = hashRegisterOtp({ email: normalizedEmail, otp });
    const expiresAt = new Date(Date.now() + REGISTER_OTP_TTL_MS);

    await UpgradeOtp.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otpHash, expiresAt, lastSentAt: new Date(), attempts: 0 },
      { upsert: true, new: true }
    );

    await sendOtpEmailViaMailer({ email: normalizedEmail, otp });

    return res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", details: error.message });
  }
};

export const verifyUpgradeOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!otp || String(otp).trim().length === 0) {
      return res.status(400).json({ success: false, message: "OTP is required." });
    }

    const record = await UpgradeOtp.findOne({ email: normalizedEmail });
    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not found. Request a new OTP." });
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      await UpgradeOtp.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ success: false, message: "OTP expired. Request a new OTP." });
    }

    const providedHash = hashRegisterOtp({ email: normalizedEmail, otp: String(otp).trim() });
    if (providedHash !== record.otpHash) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    await UpgradeOtp.deleteOne({ email: normalizedEmail });

    const token = jwt.sign(
      { email: normalizedEmail, purpose: "upgrade_to_seller" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({ success: true, message: "OTP verified.", otpToken: token });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", details: error.message });
  }
};

export const upgradeToSeller = async (req, res) => {
  try {
    const {
      userId,
      otpToken,
      // Contract form fields
      initialGrantAuthorization,
      initialOwnershipRepresentation,
      initialLicensingProtection,
      initialAffiliateUse,
      initialWaiverCompensation,
      initialWarranties,
      initialIndemnification,
      initialPublicityPromotion,
      initialLimitationLiability,
      initialArbitrationVenue,
      initialGoverningLaw,
      initialCoverageFullWorks,
      initialEntireAgreement,
      copyrightOwnerName,
      copyrightOwnerSignature,
      copyrightOwnerDate,
      labelRepresentativeName,
      labelRepresentativeSignature,
      labelRepresentativeDate,

      digitalDistributionArtistName,
      digitalDistributionArtistSignature,
      digitalDistributionArtistDate,
      digitalDistributionRepName,
      digitalDistributionRepTitle,
      digitalDistributionRepSignature,
      digitalDistributionRepDate,
      digitalDistributionDigitalStoreOption,
      digitalDistributionSummaryName,
      digitalDistributionSummarySignature,
      digitalDistributionSummaryDate,
    } = req.body || {};

    if (!userId || !otpToken) {
      return res.status(400).send({
        error: "User ID and OTP token are required",
      });
    }

    // Verify OTP token
    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
      if (!decoded || decoded.purpose !== "upgrade_to_seller") {
        return res.status(400).send({ error: "Invalid OTP token" });
      }
    } catch (err) {
      return res.status(400).send({ error: "Invalid or expired OTP token" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Verify user is a buyer
    if (user.accountType !== "buyer") {
      return res.status(400).send({ 
        error: "Only buyer accounts can upgrade to seller" 
      });
    }

    // Verify email matches
    if (normalizeEmail(user.email) !== normalizeEmail(decoded.email)) {
      return res.status(400).send({ error: "Email mismatch" });
    }

    // Update user to seller with contract data
    user.accountType = "seller";
    user.sellerApprovalStatus = "pending";
    user.initialGrantAuthorization = initialGrantAuthorization;
    user.initialOwnershipRepresentation = initialOwnershipRepresentation;
    user.initialLicensingProtection = initialLicensingProtection;
    user.initialAffiliateUse = initialAffiliateUse;
    user.initialWaiverCompensation = initialWaiverCompensation;
    user.initialWarranties = initialWarranties;
    user.initialIndemnification = initialIndemnification;
    user.initialPublicityPromotion = initialPublicityPromotion;
    user.initialLimitationLiability = initialLimitationLiability;
    user.initialArbitrationVenue = initialArbitrationVenue;
    user.initialGoverningLaw = initialGoverningLaw;
    user.initialCoverageFullWorks = initialCoverageFullWorks;
    user.initialEntireAgreement = initialEntireAgreement;
    user.copyrightOwnerName = copyrightOwnerName;
    user.copyrightOwnerSignature = copyrightOwnerSignature;
    user.copyrightOwnerDate = copyrightOwnerDate;
    user.labelRepresentativeName = labelRepresentativeName;
    user.labelRepresentativeSignature = labelRepresentativeSignature;
    user.labelRepresentativeDate = labelRepresentativeDate;

    user.digitalDistributionArtistName = digitalDistributionArtistName;
    user.digitalDistributionArtistSignature = digitalDistributionArtistSignature;
    user.digitalDistributionArtistDate = digitalDistributionArtistDate;
    user.digitalDistributionRepName = digitalDistributionRepName;
    user.digitalDistributionRepTitle = digitalDistributionRepTitle;
    user.digitalDistributionRepSignature = digitalDistributionRepSignature;
    user.digitalDistributionRepDate = digitalDistributionRepDate;
    user.digitalDistributionDigitalStoreOption = digitalDistributionDigitalStoreOption;
    user.digitalDistributionSummaryName = digitalDistributionSummaryName;
    user.digitalDistributionSummarySignature = digitalDistributionSummarySignature;
    user.digitalDistributionSummaryDate = digitalDistributionSummaryDate;

    await user.save();

    const { password: _, ...userData } = user._doc;

    res.status(200).send({ 
      success: true, 
      message: "Account upgraded to seller. Pending admin approval.",
      user: userData 
    });
  } catch (error) {
    res.status(500).send({ error: "Server error", details: error.message });
  }
};

