// Backend/service/ForgotEmail.js
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_NAME = "Jgaa Thai Restaurant";
const ADMIN_EMAIL = "no-reply@capstone.qzz.io";

async function sendResetEmail(user, resetUrl) {
  if (!user.email) return false;

  try {
    const { data, error } = await resend.emails.send({
      from: `${ADMIN_NAME} <${ADMIN_EMAIL}>`,
      to: user.email,
      subject: "Reset Your Password",
      html: `
        <p>Hello ${user.fname},</p>
        <p>This is <b>${ADMIN_NAME}</b>. You requested a password reset. Please <b>Click</b> the following link to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <b>This link expires in 1 hour</b>
        <footer>
          <p>This email was sent to: <b>${user.email}</b> to protect your account security. Please make sure to reset your password promptly.</p>
          <p>Thank you for using ${ADMIN_NAME}.</p>
        </footer>
      `,
      text: `Hello ${user.fname}, you requested a password reset. Click the following link to reset your password: ${resetUrl}. This link expires in 1 hour. Thank you for using ${ADMIN_NAME}.`,
    });

    if (error) {
      console.error("❌ Error sending reset email via Resend:", error);
      return false;
    }

    console.log("✅ Reset email sent via Resend:", data);
    return true;
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return false;
  }
}

module.exports = { sendResetEmail };
