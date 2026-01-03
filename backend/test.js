import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "secure.emailsrvr.com",
  port: 587,
  secure: false, // IMPORTANT
  auth: {
    user: "info@hgcradio.org",
    pass: "1$TrueReady"
  },
  tls: {
    rejectUnauthorized: false
  }
});

// optional but recommended
await transporter.verify();

await transporter.sendMail({
  from: "info@hgcradio.org",
  to: "test@gmail.com",
  subject: "HGC Radio Test",
  text: "Mail sent successfully 🚀"
});

console.log("Mail sent successfully");
