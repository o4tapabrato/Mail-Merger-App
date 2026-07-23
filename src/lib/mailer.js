import { decrypt } from '@/lib/crypto';
import nodemailer from 'nodemailer';

// Helper: Replace {{variable}} tags with actual row data dynamically
function renderTemplate(templateString, recipient) {
  if (!templateString) return '';
  return templateString.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim().toLowerCase();
    const dataKey = Object.keys(recipient || {}).find(
      k => k.toLowerCase() === trimmedKey
    );
    return dataKey !== undefined ? recipient[dataKey] : match;
  });
}

export async function sendEmail(agent, recipient, campaign) {
  try {
    // 1. Decrypt the password stored in the DB
    const decryptedPassword = decrypt(agent.password);

    // 2. Create the transporter for this specific agent
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or use host/port for custom SMTP
      auth: {
        user: agent.email,
        pass: decryptedPassword,
      },
    });

    // 3. Dynamically compile templates using the campaign text and current recipient row
    const dynamicSubject = renderTemplate(campaign?.subject, recipient);
    const dynamicHtml = renderTemplate(campaign?.body || campaign?.htmlContent, recipient);

    // Get email dynamically just in case casing varies
    const emailKey = Object.keys(recipient || {}).find(k => k.toLowerCase().includes('mail'));
    const recipientEmail = emailKey ? recipient[emailKey] : recipient.Email;

    // 4. Send the compiled email
    const info = await transporter.sendMail({
      from: `"${agent.email}" <${agent.email}>`,
      to: recipientEmail,
      subject: dynamicSubject,
      text: dynamicHtml.replace(/<[^>]*>?/gm, ''), // Strips HTML tags for a plain-text fallback
      html: dynamicHtml,
    });

    console.log("Email sent successfully:", info.messageId);
    return true;

  } catch (error) {
    console.error("Failed to send email via", agent.email, ":", error.message);
    return false; 
  }
}