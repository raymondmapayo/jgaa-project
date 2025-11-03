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
       <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        <p>Hello ${user.fname},</p>
        <p>This is <b>${ADMIN_NAME}</b>. You requested a password reset. Please <b>Click</b> the following link to reset your password:</p>
        <p style="margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #007BFF; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">>
        
        Reset Password</a>
        </p>
        <b>This link expires in 1 hour</b>
      <footer style="margin-top: 30px; font-size: 14px; color: #555;">
  <p>This email was sent to <b>${user.email}</b> for protecting the security of your account.</p>
  <p>Thank you for registering with ${ADMIN_NAME}.</p>
</footer>
      </div>
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
