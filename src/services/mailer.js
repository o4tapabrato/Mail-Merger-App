// src/services/mailer.js
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/crypto';

export async function sendEmail(agent, { to, subject, html, text }) {
  // 1. Decrypt the password on-the-fly
  const password = decrypt(agent.password);

  // 2. Create the transporter for this specific agent
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Change this if you use different providers
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: agent.email,
      pass: password,
    },
  });

  // 3. Send email
  try {
    const info = await transporter.sendMail({
      from: agent.email,
      to,
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email via ${agent.email}:`, error);
    return { success: false, error: error.message };
  }
}