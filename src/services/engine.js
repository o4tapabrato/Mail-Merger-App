import { sendEmail } from '@/services/mailer';
import { db } from '@/lib/prisma';

// Helper function to safely find the email key regardless of casing (e.g. Email, email, E-mail)
function getRecipientEmail(recipient) {
  const emailKey = Object.keys(recipient || {}).find(key =>
    key.toLowerCase().includes('mail')
  );
  return emailKey ? recipient[emailKey] : null;
}

// Helper function to replace {{variable}} tags with actual row data
function renderTemplate(templateString, recipient) {
  if (!templateString) return '';
  return templateString.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim().toLowerCase();
    // Find matching key case-insensitively in the recipient object
    const dataKey = Object.keys(recipient || {}).find(
      k => k.toLowerCase() === trimmedKey
    );
    return dataKey !== undefined ? recipient[dataKey] : match;
  });
}

export async function processCampaign(campaignId) {
  // 1. Fetch the campaign record to get subject and body template
  const campaign = await db.emailCampaign.findUnique({
    where: { id: campaignId }
  });

  if (!campaign) throw new Error("Campaign not found.");

  // Parse recipients if stored as JSON string
  let recipients = campaign.fileData;
  if (typeof recipients === 'string') {
    try {
      recipients = JSON.parse(recipients);
    } catch (e) {
      throw new Error("Failed to parse campaign fileData JSON");
    }
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("No recipients found for this campaign.");
  }

  // 2. Fetch all active agents for this user
  const agents = await db.mailerAgent.findMany({
    where: { userId: campaign.userId, isActive: true }
  });

  if (agents.length === 0) throw new Error("No active agents available.");

  let agentIndex = 0;

  for (const recipient of recipients) {
    const agent = agents[agentIndex];
    const recipientEmail = getRecipientEmail(recipient);

    if (!recipientEmail) {
      console.warn("Skipping row: No valid email column found.");
      continue;
    }

    // 3. Render templates dynamically using the specific row data
    const compiledSubject = renderTemplate(campaign.subject, recipient);
    const compiledHtml = renderTemplate(campaign.body, recipient);

    console.log("--- DEBUG TEMPLATE ---");
    console.log("Recipient Object:", recipient);
    console.log("Raw Campaign Body:", campaign.body);
    console.log("Compiled HTML Result:", compiledHtml);
    console.log("----------------------");

    // 4. Send via current agent
    const result = await sendEmail(agent, {
      to: recipientEmail,
      subject: compiledSubject,
      html: compiledHtml,
    });

    if (result.success) {
      console.log(`Sent to ${recipientEmail} via ${agent.email}`);
    }

    // 5. Rotate to next agent
    agentIndex = (agentIndex + 1) % agents.length;
  }
}