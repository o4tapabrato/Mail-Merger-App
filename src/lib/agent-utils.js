import { db } from '@/lib/prisma';

export async function incrementAgentUsage(agentId) {
  try {
    await db.mailerAgent.update({
      where: { id: agentId },
      data: {
        sentToday: { increment: 1 }
      }
    });
  } catch (error) {
    console.error("Failed to update agent usage:", error);
  }
}