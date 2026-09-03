import LoveGift from "../../models/loveGift.model.js";
import User from "../../models/user.model.js";
import pkg from "authorizenet";
import { sendEmail } from "../../utils/util.js";
import { notifyAdmin, notifyUser } from "../../utils/notify.js";

const { APIContracts, APIControllers, Constants: SDKConstants } = pkg;

/*
  GET /api/love-gift/artists
  Artists a donor may designate a gift for: approved sellers only. A seller whose
  form is still pending or was rejected must not be selectable, or the station
  would be taking money on behalf of someone it has not cleared.
*/
export const listGiftableArtists = async (req, res) => {
  try {
    const artists = await User.find({
      role: "User",
      accountType: "seller",
      sellerApprovalStatus: "approved",
    })
      .select("_id name")
      .sort({ name: 1 });

    return res.status(200).json({ success: true, artists });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load artists",
      error: error.message,
    });
  }
};

const chargeCard = ({ cardNumber, expiryMonth, expiryYear, cvv, amount }) => {
  const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(process.env.AUTHORIZENET_API_LOGIN_ID);
  merchantAuthenticationType.setTransactionKey(process.env.AUTHORIZENET_TRANSACTION_KEY);

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
  transactionRequestType.setAmount(amount);
  transactionRequestType.setTransactionSettings(transactionSettings);

  const createRequest = new APIContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuthenticationType);
  createRequest.setTransactionRequest(transactionRequestType);

  const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());

  // Defaults to production so live behaviour is unchanged. Set
  // AUTHORIZENET_ENV=sandbox in backend/.env to test without charging real cards.
  ctrl.setEnvironment(
    process.env.AUTHORIZENET_ENV === "sandbox"
      ? SDKConstants.endpoint.sandbox
      : SDKConstants.endpoint.production
  );

  // Always resolves — the caller decides what to do with a failure, so that a
  // declined card still gets recorded rather than vanishing into a throw.
  return new Promise((resolve) => {
    ctrl.execute(() => {
      try {
        const response = new APIContracts.CreateTransactionResponse(ctrl.getResponse());
        if (!response) return resolve({ success: false, error: "No response from payment gateway." });

        const txn = response.getTransactionResponse();

        if (response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
          if (txn && txn.getMessages()) {
            return resolve({ success: true, transactionId: txn.getTransId() });
          }
          if (txn && txn.getErrors()) {
            return resolve({ success: false, error: txn.getErrors().getError()[0].getErrorText() });
          }
          return resolve({ success: false, error: "Transaction was declined." });
        }

        if (txn && txn.getErrors()) {
          return resolve({ success: false, error: txn.getErrors().getError()[0].getErrorText() });
        }
        return resolve({ success: false, error: response.getMessages().getMessage()[0].getText() });
      } catch (e) {
        return resolve({ success: false, error: e?.message || "Payment gateway error." });
      }
    });
  });
};

/*
  POST /api/love-gift/process-payment
  Records the gift before charging, so a declined card still leaves a trace the
  admin can see, then marks it paid or failed.
*/
export const processLoveGift = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      amount,
      comment,
      recipientType,
      artistId,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
    } = req.body || {};

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required." });
    }
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
      return res.status(400).json({ success: false, message: "Card details are required." });
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid amount." });
    }

    const type = recipientType === "artist" ? "artist" : "station";

    // Resolve the artist server-side; never trust a name posted by the browser
    let artist = null;
    if (type === "artist") {
      if (!artistId) {
        return res.status(400).json({ success: false, message: "Please choose an artist." });
      }
      artist = await User.findOne({
        _id: artistId,
        role: "User",
        accountType: "seller",
        sellerApprovalStatus: "approved",
      }).select("_id name email");

      if (!artist) {
        return res.status(400).json({ success: false, message: "That artist is not available." });
      }
    }

    const gift = await LoveGift.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim().toLowerCase(),
      amount: amountNum,
      comment: comment || "",
      recipientType: type,
      artist: artist?._id || null,
      artistName: artist?.name || "",
      artistEmail: artist?.email || "",
      paymentStatus: "pending",
    });

    const result = await chargeCard({ cardNumber, expiryMonth, expiryYear, cvv, amount: amountNum });

    if (!result.success) {
      await LoveGift.findByIdAndUpdate(gift._id, {
        paymentStatus: "failed",
        failureReason: result.error || "Payment failed",
      });
      return res.status(502).json({ success: false, message: result.error || "Payment failed" });
    }

    const paid = await LoveGift.findByIdAndUpdate(
      gift._id,
      { paymentStatus: "paid", transactionId: result.transactionId, paidAt: new Date() },
      { new: true }
    );

    const donorName = `${paid.firstName} ${paid.lastName}`.trim();
    const designation = artist ? `for ${artist.name}` : "for the station";

    await notifyAdmin({
      type: "love_gift_received",
      title: artist
        ? `Love Gift received for ${artist.name}`
        : "Love Gift received for the station",
      message: `${donorName} gave $${amountNum.toFixed(2)} ${designation}.`,
      refId: paid._id,
      refModel: "LoveGift",
      actorName: donorName,
      actorEmail: paid.email,
    });

    /*
      Tell the artist a gift came in — without the amount. The station collects
      the money and decides each payout separately, so naming the donor's figure
      here would set an expectation the payout may not match.
    */
    if (artist) {
      await notifyUser({
        userId: artist._id,
        type: "gift_received_artist",
        title: "Someone sent you a Love Gift",
        message: `${donorName} gave a Love Gift in your name${paid.comment ? ` — "${paid.comment}"` : ""}.`,
        refId: paid._id,
        refModel: "LoveGift",
        actorName: donorName,
      });
    }

    try {
      await sendEmail({
        to: paid.email,
        subject: "Thank you for your Love Gift",
        html: `Hello ${donorName},<br><br>
Thank you for your Love Gift to HG Radio Station.<br><br>
Amount: $${amountNum.toFixed(2)}<br>
${artist ? `Designated for: ${artist.name}<br>` : ""}
Transaction ID: ${result.transactionId}<br>
Date: ${new Date().toLocaleDateString()}<br><br>
With gratitude,<br>
The HG Radio Station Team`,
      });
    } catch (e) {
      console.error("Love Gift receipt email failed:", e?.message || e);
    }

    return res.status(200).json({
      success: true,
      transactionId: result.transactionId,
      gift: paid,
    });
  } catch (error) {
    console.error("processLoveGift error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Server error",
    });
  }
};
