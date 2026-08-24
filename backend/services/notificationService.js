const nodemailer = require("nodemailer");

async function sendEmail(to, subject, text) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[EMAIL DEMO] To: ${to} | ${subject} | ${text}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text
  });
}

async function sendSms(to, text) {
  // Optional Twilio integration can be added using the environment variables.
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS DEMO] To: ${to} | ${text}`);
    return;
  }
  console.log("Twilio credentials detected. Add Twilio SDK if SMS sending is required.");
}

async function notifyStatus(customer, order, status) {
  const text = `Order #${order.id} status changed to ${status}.`;
  try { await sendEmail(customer.email, `Delivery update for order #${order.id}`, text); } catch (e) { console.error("Email error:", e.message); }
  try { await sendSms(customer.phone, text); } catch (e) { console.error("SMS error:", e.message); }
}

module.exports = { notifyStatus };
