/*
const sgMail = require("@sendgrid/mail");

//Load API key
const API_KEY = process.env.SENDGRID_API_KEY || "";
if (!API_KEY) throw new Error("SENDGRID_API_KEY is not defined");

sgMail.setApiKey(API_KEY);

const VERIFIED_SENDER = "hanzdarylqezada11@gmail.com";

// Send confirmation email (custom body supported)
const sendConfirmationEmail = async (
  email,
  full_name,
  reservation_date,
  reservation_time,
  table,
  customBody // ✅ optional: use textbox content if provided
) => {
  const subject = "Reservation Confirmation - JGAA Restaurant";

  const defaultBody = `
    Hello ${full_name},

    Your reservation is confirmed! 🎉

    Reservation Details:
    - Date: ${reservation_date}
    - Time: ${reservation_time}
    - Table: ${table}

    Thank you for choosing JGAA Restaurant!
  `;

  const body = customBody?.trim() ? customBody : defaultBody;

  const message = {
    to: email,
    from: VERIFIED_SENDER,
    subject,
    text: body,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #fa8c16;">Reservation Confirmed 🎉</h2>
      <p>Hi <strong>${full_name}</strong>,</p>
      <p>${body.replace(/\n/g, "<br/>")}</p>
    </div>`,
  };

  try {
    await sgMail.send(message);
    console.log(`✅ Reservation email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending confirmation email:", error);
    if (error.response) console.error("Response:", error.response.body);
  }
};

module.exports = { sendConfirmationEmail };
/*/
