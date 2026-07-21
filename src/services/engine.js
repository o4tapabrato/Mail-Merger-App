import { sendEmail } from '@/services/mailer'; // Your previously created service
import { db } from '@/lib/prisma';

export async function processCampaign(campaignId, recipients) {
  // 1. Fetch all active agents
  const agents = await db.mailerAgent.findMany({ where: { isActive: true } });
  if (agents.length === 0) throw new Error("No active agents available.");

  let agentIndex = 0;

  for (const recipient of recipients) {
    const agent = agents[agentIndex];

    // 2. Simple logic: Send via current agent
    const result = await sendEmail(agent, {
      to: recipient.email,
      subject: campaign.subject, // Assume campaign object is passed/fetched
      html: renderTemplate(campaign.body, recipient), // You'll need a helper to swap {{vars}}
    });

    if (result.success) {
      console.log(`Sent to ${recipient.email} via ${agent.email}`);
    }

    // 3. Rotate to next agent
    agentIndex = (agentIndex + 1) % agents.length;
  }
}