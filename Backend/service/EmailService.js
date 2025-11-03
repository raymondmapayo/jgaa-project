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
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;"> 
        <p>Hello ${user.fname},</p>
        <p>Please verify your email by clicking the button below:</p>
        <p style="margin: 20px 0;">
          <a href="${verificationUrl}" style="background-color: #007BFF; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
        </p>
        <p><b>This link expires in 7 days.</b></p>

        <!-- Footer -->
        <footer style="margin-top: 30px; font-size: 14px; color: #555;">
          <p>This email was sent to <b>${
            user.email
          }</b> to protect your account security.</p>
          <p>If you did not register, please ignore this email.</p>
          <p>© ${new Date().getFullYear()} ${ADMIN_NAME}. All rights reserved.</p>
        </footer>

        <p>Thank you for registering with ${ADMIN_NAME}.</p>
      </div>
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
