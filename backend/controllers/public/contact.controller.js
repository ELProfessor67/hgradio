import Contact from "../../models/contact.model.js";
import pkg from 'authorizenet';
import { sendEmail } from "../../utils/util.js";

const { APIContracts, APIControllers,Constants:SDKConstants } = pkg;


export const createContact = async (req, res) => {
  try {

    const contact = await Contact.create(req.body);
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ message: "Failed to create contact", error: err });
  }
};


/*
  Submissions carry their kind as a prefix on the first line of `comment` —
  the app and the website guestbook both write it. There is no type column, so
  filtering means matching that prefix.

  `^` anchors to the start so a testimony that merely mentions the word "prayer"
  in its body is not mistaken for a prayer request.
*/
// Regex literals, not strings — the brackets must stay escaped or "[TESTIMONY]"
// is read as a character class and matches almost nothing.
const TYPE_PREFIX = {
  testimony: /^\[TESTIMONY\]/,
  prayer: /^\[PRAYER REQUEST\]/,
  greeting: /^\[GREETING \/ SHOUT-OUT\]/,
  guestbook: /^Guestbook Submission/,
};

const ANY_TAGGED = /^\[TESTIMONY\]|^\[PRAYER REQUEST\]|^\[GREETING \/ SHOUT-OUT\]|^Guestbook Submission/;

// Anything that is not one of the tagged kinds above
const UNTAGGED = { comment: { $not: ANY_TAGGED } };

export const getAllContact = async (req, res) => {
  try {
    const search = req.query.search || "";
    const type = String(req.query.type || "");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (TYPE_PREFIX[type]) {
      filter.comment = { $regex: TYPE_PREFIX[type] };
    } else if (type === "other") {
      Object.assign(filter, UNTAGGED);
    }

    // Search across sender and message, not email alone — the message is where
    // the useful text lives, and it was previously unsearchable.
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { comment: { $regex: search, $options: "i" } },
      ];
    }

    // Per-type counts so the admin tabs can show how many of each there are
    const countFor = (t) =>
      Contact.countDocuments(
        t === "other" ? UNTAGGED : { comment: { $regex: TYPE_PREFIX[t] } }
      );

    const [total, counts] = await Promise.all([
      Contact.countDocuments(filter),
      Promise.all([
        countFor("testimony"),
        countFor("prayer"),
        countFor("greeting"),
        countFor("guestbook"),
        countFor("other"),
        Contact.countDocuments({}),
      ]),
    ]);

    const typeCounts = {
      testimony: counts[0],
      prayer: counts[1],
      greeting: counts[2],
      guestbook: counts[3],
      other: counts[4],
      all: counts[5],
    };
    const contact = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      data: contact,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      typeCounts,
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



export const processPayment = async (req, res) => {
  try {
    const { cardNumber, expiryMonth, expiryYear, cvv, email, firstName, lastName, amount } = req.body;
    const constants = {
        apiLoginKey: process.env.AUTHORIZENET_API_LOGIN_ID, // Your Authorize.Net API Login ID
        transactionKey: process.env.AUTHORIZENET_TRANSACTION_KEY, // Your Authorize.Net Transaction Key
    };



  

    const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(constants.apiLoginKey);
    merchantAuthenticationType.setTransactionKey(constants.transactionKey);

    const creditCard = new APIContracts.CreditCardType();
    creditCard.setCardNumber(cardNumber);
    creditCard.setExpirationDate(`${expiryMonth}-${expiryYear}`);
    creditCard.setCardCode(cvv);

    const paymentType = new APIContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const transactionSetting = new APIContracts.SettingType();
    transactionSetting.setSettingName('recurringBilling');
    transactionSetting.setSettingValue('false');

    const transactionSettingList = [transactionSetting];
    
    const transactionSettings = new APIContracts.ArrayOfSetting();
    transactionSettings.setSetting(transactionSettingList);

    const transactionRequestType = new APIContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(amount);
    transactionRequestType.setTransactionSettings(transactionSettings);

    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(SDKConstants.endpoint.production);
 

    const response = await new Promise((resolve, reject) => {
        ctrl.execute(() => {
            const apiResponse = ctrl.getResponse();
            const response = new APIContracts.CreateTransactionResponse(apiResponse);

            if (response !== null) {
                if (response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
                    if (response.getTransactionResponse() && response.getTransactionResponse().getMessages()) {
                        console.log('Successfully created transaction with Transaction ID: ' + response.getTransactionResponse().getTransId());
                        console.log('Response Code: ' + response.getTransactionResponse().getResponseCode());
                        console.log('Message Code: ' + response.getTransactionResponse().getMessages().getMessage()[0].getCode());
                        console.log('Description: ' + response.getTransactionResponse().getMessages().getMessage()[0].getDescription());
                        resolve({ success: true, transactionId: response.getTransactionResponse().getTransId() });
                    } else {
                        console.log('Failed Transaction.',1);
                        if(response.getTransactionResponse().getErrors() != null) {
                            console.log('Error Code: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                            console.log('Error message: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorText());
                            reject({ success: false, error: response.getTransactionResponse().getErrors().getError()[0].getErrorText() });
                        }
                    }
                } else {
                    console.log('Failed Transaction.',2);
                    if (response.getTransactionResponse() && response.getTransactionResponse().getErrors()) {
                        console.log('Error Code: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                        console.log('Error message: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorText());
                        reject({ success: false, error: response.getTransactionResponse().getErrors().getError()[0].getErrorText() });
                    } else {
                        console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                        console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                        reject({ success: false, error: response.getMessages().getMessage()[0].getText() });
                    }
                }
            } else {
                reject({ success: false, error: 'No response.' });
            }
        });
    });

 
    if(response.success){
        try {
            const formatDate = (date) => {
                try {
                    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
                } catch (_) {
                    return date.toISOString().split('T')[0];
                }
            };
            const message = `Donation Successful! 🎉

                Hello ${firstName || ''} ${lastName || ''},

                Thank you for your generous donation to HG Radio Station! 🎤✨ Your support helps us continue to bring joy and create unforgettable karaoke experiences. We’re grateful to have you as part of our community!

                Here are the details of your donation:

                Amount Donated: ${amount}
                Date of Donation: ${formatDate(new Date())}
                Your contribution enables us to:

                Expand our song library 🎶
                Enhance karaoke features 🎤
                Host special events and competitions 🎉
                We truly appreciate your support, and we hope you continue enjoying the fun and excitement that HG Sing-Along offers. If you have any questions or need assistance, feel free to contact us anytime!

                Keep singing and spreading joy!

                Best regards,
                The HG Radio Station Team

                `

            await sendEmail({to:email,subject:'Donation Successful! 🎉',html:message}); 
        } catch (error) {
            console.log('error during send mail : ', error.message)
        }

        return res.status(200).json(response);
    }else{
        return res.status(501).json(response);
    }

  } catch (error) {
      console.log(error)
      return res.status(500).json({ success: false, message: error.error || error.message });
  }
};