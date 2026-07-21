import { db } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

export async function processQueue(targetCampaignId = null) {
  console.log("--- [WORKER] Processing Queue ---", targetCampaignId ? `Target: ${targetCampaignId}` : "Auto-mode");

  let campaign = null;

  if (targetCampaignId) {
    // If a specific campaign was triggered, fetch it directly
    campaign = await db.emailCampaign.findFirst({
      where: { id: targetCampaignId }
    });
  } else {
    // Otherwise, grab the next queued campaign
    campaign = await db.emailCampaign.findFirst({
      where: { status: 'QUEUED' },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  if (!campaign) {
    console.log("[WORKER] No campaigns found to process.");
    return { success: false, message: "No campaigns to process" };
  }

  // GUARD: If another campaign is running AND this isn't the targeted one, block overlap
  if (!targetCampaignId) {
    const activeCampaign = await db.emailCampaign.findFirst({
      where: { status: 'RUNNING' }
    });
    if (activeCampaign) {
      console.log(`[WORKER] Campaign ${activeCampaign.id} is already running. Skipping.`);
      return { success: false, message: "A campaign is already running" };
    }
  }

  const potentialAgents = await db.mailerAgent.findMany({ 
    where: { userId: campaign.userId, isActive: true } 
  });
  
  if (potentialAgents.length === 0) {
    console.log("[WORKER] No active agents found for user:", campaign.userId);
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

    if (sentCount < agent.dailyLimit) {
      selectedAgent = agent;
      break;
    }
  }

  if (!selectedAgent) {
    console.log("[WORKER] All agents have reached their 24-hour limit.");
    await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'QUEUED' } });
    return { success: false, message: "Capacity reached for user agents" };
  }

  // Mark campaign as RUNNING
  await db.emailCampaign.update({
    where: { id: campaign.id },
    data: { status: 'RUNNING' }
  });

  await processCampaignBatch(campaign, selectedAgent);
  return { success: true, agentId: selectedAgent.id };
}

async function processCampaignBatch(campaign, agent) {
  try {
    let recipients = campaign.fileData;
    if (typeof recipients === 'string') {
      try {
        recipients = JSON.parse(recipients);
      } catch (e) {
        throw new Error("Failed to parse campaign fileData JSON");
      }
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      console.error(`[WORKER] Campaign ${campaign.id} has invalid or empty recipient data.`);
      await db.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: 'FAILED' }
      });
      return;
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    while (true) {
      // 1. Fetch fresh campaign state to prevent stale memory closures
      const freshCampaign = await db.emailCampaign.findUnique({
        where: { id: campaign.id }
      });

      if (!freshCampaign || freshCampaign.status === 'HALTED' || freshCampaign.status === 'COMPLETED') {
        console.log(`[WORKER] Campaign ${campaign.id} status changed to ${freshCampaign?.status}. Stopping batch.`);
        return;
      }

      let currentIndex = freshCampaign.lastRowSent || 0;

      // 2. Base case: Break loop if all recipients have been processed
      if (currentIndex >= recipients.length) {
        await db.emailCampaign.update({
          where: { id: campaign.id },
          data: { status: 'COMPLETED', lastRowSent: recipients.length }
        });
        console.log(`[WORKER] Campaign ${campaign.id} completed successfully.`);
        break;
      }

      // 3. Re-verify agent daily limit capacity mid-run
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
        console.log(`[WORKER] Agent capacity reached mid-run. Re-queuing campaign ${campaign.id}`);
        return;
      }

      const recipient = recipients[currentIndex];
      const email = recipient?.Email || recipient?.email;

      // 4. Immediately advance checkpoint *before* sending to lock out duplicate processing
      const nextIndex = currentIndex + 1;
      await db.emailCampaign.update({
        where: { id: campaign.id },
        data: { lastRowSent: nextIndex }
      });

      if (!email) {
        console.error(`[WORKER] Skipping index ${currentIndex}: No email found in row object.`);
        continue;
      }

      console.log(`[WORKER] Sending to: ${email} (${nextIndex}/${recipients.length}) via Agent ${agent.email}`);

      try {
        const success = await sendEmail(agent, recipient, campaign);

        await db.emailLog.create({
          data: {
            userId: campaign.userId,
            campaignId: campaign.id,
            agentId: agent.id,
            recipient: email,
            status: success ? 'SENT' : 'FAILED',
            sentAt: new Date()
          }
        });

        if (!success) {
          console.error(`[WORKER] Mailer returned false status for ${email}`);
        }
      } catch (err) {
        console.error(`[WORKER] Exception sending to ${email}:`, err.message);
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
      }
    }

  } catch (error) {
    console.error("[WORKER] Batch Exception Error:", error);
    await db.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: 'QUEUED' }
    });
  }
}