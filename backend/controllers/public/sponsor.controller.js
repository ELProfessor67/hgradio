import Sponsor from "../../models/sponsor.model.js";
import pkg from "authorizenet";
import { sendEmail } from "../../utils/util.js";

const { APIContracts, APIControllers, Constants: SDKConstants } = pkg;

export const createSponsor = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.amount !== undefined && payload.amount !== null && payload.amount !== "") {
      payload.amount = Number(payload.amount);
    }

    // If it's not a gift, payment isn't required.
    if (payload.method !== "gift") {
      payload.paymentStatus = "not_required";
      payload.transactionId = undefined;
      payload.paidAt = undefined;
    }

    const sponsor = await Sponsor.create(payload);
    res.status(201).json({ success: true, data: sponsor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create sponsor", error: err });
  }
};


export const getAllSponsor = async (req, res) => {
  try {
    const search = req.query.search || "";
    const method = req.query.method || "";
    const sponsorType = req.query.sponsorType || "";
    const paymentStatus = req.query.paymentStatus || "";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { organization: { $regex: search, $options: "i" } },
        { sponsorTarget: { $regex: search, $options: "i" } },
      ];
    }

    if (method) filter.method = method;
    if (sponsorType) filter.sponsorType = sponsorType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        // include the full end date day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const total = await Sponsor.countDocuments(filter);
    const sponsor = await Sponsor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: sponsor,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get sponsor" });
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


const sendSponsorPaymentEmailViaMailer = async ({ email, name, amount, transactionId }) => {
  const resp = await fetch("https://mailing.hgcradio.org/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, subject: "Sponsorship Payment Successful", message: `Sponsorship payment successful! 🎉

Hello ${String(name || "")},

Thank you for your Love Gift sponsorship to HG Radio Station.

Amount: ${amount}
Transaction ID: ${String(transactionId || "")}
Date: ${new Date().toLocaleDateString()}

Best regards,
The HG Radio Station Team
` }),
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

export const processSponsorPayment = async (req, res) => {
  try {
    const {
      sponsorData,
      payment,
    } = req.body || {};

    const {
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      amount,
    } = payment || {};

    if (!sponsorData) {
      return res.status(400).json({ success: false, message: "Missing sponsorData" });
    }
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
      return res.status(400).json({ success: false, message: "Missing card details" });
    }
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // Create sponsor first as pending (so admin can see attempts even if payment fails).
    const pendingSponsorPayload = {
      ...sponsorData,
      method: "gift",
      amount: amountNum,
      paymentStatus: "pending",
      transactionId: undefined,
      paidAt: undefined,
    };

    const sponsorDoc = await Sponsor.create(pendingSponsorPayload);

    const constants = {
      apiLoginKey: process.env.AUTHORIZENET_API_LOGIN_ID,
      transactionKey: process.env.AUTHORIZENET_TRANSACTION_KEY,
    };

    const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(constants.apiLoginKey);
    merchantAuthenticationType.setTransactionKey(constants.transactionKey);

    const creditCard = new APIContracts.CreditCardType();
    creditCard.setCardNumber(String(cardNumber));
    creditCard.setExpirationDate(`${expiryMonth}-${expiryYear}`);
    creditCard.setCardCode(String(cvv));

    const paymentType = new APIContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const transactionSetting = new APIContracts.SettingType();
    transactionSetting.setSettingName("recurringBilling");
    transactionSetting.setSettingValue("false");

    const transactionSettings = new APIContracts.ArrayOfSetting();
    transactionSettings.setSetting([transactionSetting]);

    const transactionRequestType = new APIContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(amountNum);
    transactionRequestType.setTransactionSettings(transactionSettings);

    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(SDKConstants.endpoint.production);

    const result = await new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        if (response !== null) {
          if (response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
            if (response.getTransactionResponse() && response.getTransactionResponse().getMessages()) {
              resolve({ success: true, transactionId: response.getTransactionResponse().getTransId() });
            } else {
              if (response.getTransactionResponse().getErrors() != null) {
                reject({ success: false, error: response.getTransactionResponse().getErrors().getError()[0].getErrorText() });
              } else {
                reject({ success: false, error: "Failed transaction" });
              }
            }
          } else {
            if (response.getTransactionResponse() && response.getTransactionResponse().getErrors()) {
              reject({ success: false, error: response.getTransactionResponse().getErrors().getError()[0].getErrorText() });
            } else {
              reject({ success: false, error: response.getMessages().getMessage()[0].getText() });
            }
          }
        } else {
          reject({ success: false, error: "No response." });
        }
      });
    });

    if (!result?.success) {
      await Sponsor.findByIdAndUpdate(sponsorDoc._id, { paymentStatus: "failed" });
      return res.status(502).json({ success: false, message: "Payment failed", data: sponsorDoc });
    }

    const sponsor = await Sponsor.findByIdAndUpdate(
      sponsorDoc._id,
      {
        paymentStatus: "paid",
        transactionId: result.transactionId,
        paidAt: new Date(),
      },
      { new: true }
    );

    try {
      const message = `Sponsorship payment successful! 🎉

Hello ${String(sponsor?.name || sponsorDoc?.name || "")},

Thank you for your Love Gift sponsorship to HG Radio Station.

Amount: ${amountNum}
Transaction ID: ${String(result.transactionId || "")}
Date: ${new Date().toLocaleDateString()}

Best regards,
HG Radio Station Team
`;
      if (sponsor?.email) {
        await sendSponsorPaymentEmailViaMailer({
          email: sponsor.email,
          name: sponsor.name,
          amount: amountNum,
          transactionId: result.transactionId,
        });
      }
    } catch (e) {
      // don't fail the request if email fails
      console.log("Sponsor email send error:", e?.message || e);
    }

    return res.status(200).json({ success: true, transactionId: result.transactionId, data: sponsor });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error?.error || error?.message || "Server error" });
  }
};
