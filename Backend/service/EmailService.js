// service/EmailService.js
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_NAME = "Jgaa Thai Restaurant";
const ADMIN_EMAIL = "no-reply@capstone.qzz.io";

async function sendVerificationEmailToClient(user) {
  if (user.role !== "client") return false;

  const verificationUrl = `https://jgaa-project.vercel.app/verify-email/${user.verification_token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${ADMIN_NAME} <${ADMIN_EMAIL}>`,
      to: user.email,
      subject: "Please Verify Your Email Address",
      // HTML version
      html: `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        <p>Hello ${user.fname},</p>
        <p>This is <b>${ADMIN_NAME}</b>. Please click the link below to verify your email address:</p>
        <p style="margin: 20px 0;">
          <a href="${verificationUrl}" style="background-color: #007BFF; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
        </p>
        <p><b>This link expires in 7 days.</b></p>
        <footer style="margin-top: 30px; font-size: 14px; color: #555;">
          <p>This email was sent to <b>${user.email}</b> for protecting the security of your account.</p>
          <p>Thank you for registering with ${ADMIN_NAME}.</p>
        </footer>
      </div>
      `,

      // Plain-text fallback
      text: `Hello ${user.fname},

      This is ${ADMIN_NAME}. Please verify your email by clicking the link below:
      ${verificationUrl}

    This link expires in 7 days.

    This email was sent to ${user.email} to protect your account. Thank you for registering with ${ADMIN_NAME}.`,
    });

    if (error) {
      console.error("❌ Error sending verification email via Resend:", error);
      return false;
    }

    console.log("✅ Verification email sent via Resend:", data);
    return true;
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return false;
  }
}

module.exports = { sendVerificationEmailToClient };
