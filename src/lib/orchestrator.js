import { db } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

export async function processQueue() {
  console.log("--- [ORCHESTRATOR] processQueue called ---");

  const campaign = await db.emailCampaign.findFirst({
    where: { status: 'QUEUED' },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });

  if (!campaign) {
    console.log("[ORCHESTRATOR] No QUEUED campaigns found in DB.");
    return { success: false, message: "No campaigns to process" };
  }

  console.log(`[ORCHESTRATOR] Found campaign: ${campaign.id}, Name: ${campaign.name}, fileData type:`, typeof campaign.fileData);

  const potentialAgents = await db.mailerAgent.findMany({ 
    where: { userId: campaign.userId, isActive: true } 
  });
  
  console.log(`[ORCHESTRATOR] Found ${potentialAgents.length} active agents for user ${campaign.userId}`);

  if (potentialAgents.length === 0) {
    console.log("[ORCHESTRATOR] Error: No active agents found for this user!");
    return { success: false, message: "No active agents available" };
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let selectedAgent = null;

  for (const agent of potentialAgents) {
    const sentCount = await db.emailLog.count({
      where: {
        userId: campaign.userId,
        agentId: agent.id,
        sentAt: { gte: twentyFourHoursAgo }
      }
    });

    console.log(`[ORCHESTRATOR] Agent ${agent.email}: sent ${sentCount} in last 24h (Limit: ${agent.dailyLimit})`);

    if (sentCount < agent.dailyLimit) {
      selectedAgent = agent;
      break;
    }
  }

  if (!selectedAgent) {
    console.log("[ORCHESTRATOR] All agents have reached their capacity limits.");
    return { success: false, message: "Capacity reached for user agents" };
  }

  console.log(`[ORCHESTRATOR] Selected agent: ${selectedAgent.email}. Setting campaign to RUNNING.`);

  await db.emailCampaign.update({
    where: { id: campaign.id },
    data: { status: 'RUNNING' }
  });

  await processCampaignBatch(campaign, selectedAgent);
  return { success: true, agentId: selectedAgent.id };
}

async function processCampaignBatch(campaign, agent) {
  try {
    // 1. Safe parsing of fileData
    let recipients = campaign.fileData;
    if (typeof recipients === 'string') {
      try {
        recipients = JSON.parse(recipients);
      } catch (e) {
        throw new Error("Failed to parse campaign fileData JSON");
      }
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      console.error(`[CRITICAL] Campaign ${campaign.id} has no recipients or invalid format:`, campaign.fileData);
      await db.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: 'FAILED' } // Mark failed instead of completed
      });
      return;
    }

    let index = campaign.lastRowSent || 0;
    console.log(`Starting campaign ${campaign.id}. Total recipients: ${recipients.length}, Resuming from index: ${index}`);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    while (index < recipients.length) {
      // Re-verify agent daily limit capacity
      const currentAgent = await db.mailerAgent.findUnique({ where: { id: agent.id } });
      const currentSentCount = await db.emailLog.count({
        where: {
          userId: campaign.userId,
          agentId: agent.id,
          sentAt: { gte: twentyFourHoursAgo }
        }
      });

      if (!currentAgent || currentSentCount >= currentAgent.dailyLimit) {
        await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'QUEUED' } });
        console.log(`Agent capacity reached. Re-queuing campaign ${campaign.id}`);
        return;
      }

      const recipient = recipients[index];
      // Fallback check for lowercase or uppercase email keys
      const email = recipient?.Email || recipient?.email;

      if (!email) {
        console.error(`Skipping index ${index}: No email found in object:`, recipient);
        index++;
        await db.emailCampaign.update({
          where: { id: campaign.id },
          data: { lastRowSent: index }
        });
        continue;
      }

      console.log(`Attempting to send email to: ${email} (${index + 1}/${recipients.length})`);

      let success = false;
      try {
        success = await sendEmail(agent, recipient);
      } catch (err) {
        console.error(`sendEmail threw an exception for ${email}:`, err);
        success = false;
      }

      if (success) {
        await db.emailLog.create({
          data: {
            userId: campaign.userId,
            campaignId: campaign.id,
            agentId: agent.id,
            recipient: email,
            status: 'SENT',
            sentAt: new Date()
          }
        });
        console.log(`Successfully sent and logged for: ${email}`);
      } else {
        await db.emailLog.create({
          data: {
            userId: campaign.userId,
            campaignId: campaign.id,
            agentId: agent.id,
            recipient: email,
            status: 'FAILED',
            sentAt: new Date()
          }
        });
        console.log(`Failed to send for: ${email}`);
      }

      index++;
      await db.emailCampaign.update({
        where: { id: campaign.id },
        data: { lastRowSent: index }
      });
    }

    // Only mark completed if we actually finished all rows
    await db.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: 'COMPLETED' }
    });
    console.log(`Campaign ${campaign.id} completed successfully.`);

  } catch (error) {
    console.error("Batch Error Exception:", error);
    await db.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: 'QUEUED' }
    });
  }
}

export async function getAgentSentCount(userId, agentId) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return await db.emailLog.count({
    where: {
      userId: userId,
      agentId: agentId,
      sentAt: { gte: twentyFourHoursAgo }
    }
  });
}