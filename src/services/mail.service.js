import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (to, code) => {
  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    console.log('-----------------------------------------');
    console.log(`📧 [Email Simulation] To: ${to}`);
    console.log(`🔑 [Email Simulation] Verification Code: ${code}`);
    console.log('-----------------------------------------');
    return;
  }

  const mailOptions = {
    from: `"BildyApp" <${env.EMAIL_USER}>`,
    to,
    subject: 'Verify your BildyApp account',
    text: `Your verification code is: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #333;">Welcome to BildyApp!</h2>
        <p>Please use the following code to verify your email address:</p>
        <div style="background: #f4f4f4; padding: 10px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold;">
          ${code}
        </div>
        <p>This code will expire soon.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${to}`);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);

  }
};
