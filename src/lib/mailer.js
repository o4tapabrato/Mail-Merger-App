import { decrypt } from '@/lib/crypto';
import nodemailer from 'nodemailer';

export async function sendCampaignBatch(campaign, agent) {
  const recipients = campaign.fileData; // Your array of recipients
  
  // Start from where we left off
  let index = campaign.lastRowSent;
  
  while (index < recipients.length && agent.sentToday < agent.dailyLimit) {
    // 1. Send the email using your existing mailer logic
    // await sendEmail(agent, recipients[index]);

    // 2. Update Progress
    index++;
    agent.sentToday++;
    
    // 3. Persist progress every email (or every 5-10 for better performance)
    await db.emailCampaign.update({
      where: { id: campaign.id },
      data: { lastRowSent: index }
    });

    await db.mailerAgent.update({
      where: { id: agent.id },
      data: { sentToday: agent.sentToday }
    });
  }

  // 4. Final Cleanup
  if (index >= recipients.length) {
    await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'COMPLETED' } });
  } else {
    await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'QUEUED' } });
  }
}
// To this (if the export is named 'decrypt'):

export async function sendEmail(agent, recipient) {
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

    // 3. Send the email
    // You can use recipient.Name, recipient.Company, etc., in your template
    const info = await transporter.sendMail({
      from: `"${agent.email}" <${agent.email}>`,
      to: recipient.Email,
      subject: `Hello ${recipient.Name}`,
      text: `Hi ${recipient.Name}, hope you are doing well at ${recipient.Company}.`,
      html: `<p>Hi ${recipient.Name},</p><p>Hope you are doing well at <b>${recipient.Company}</b>.</p>`,
    });

    console.log("Email sent successfully:", info.messageId);
    return true;

  } catch (error) {
    console.error("Failed to send email via", agent.email, ":", error.message);
    return false; // Return false so the Orchestrator knows to stop/pause
  }
}