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
      html: `
        <p>Hello ${user.fname},</p>
        <p>Please click the link below to verify your email:</p>
        <p><a href="${verificationUrl}">Verify Email</a></p>
        <p><b>This link expires in 7 days.</b></p>
        <p>Thank you for registering with ${ADMIN_NAME}.</p>
      `,
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
