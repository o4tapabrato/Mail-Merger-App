import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Scoped Campaign Stats
    const [running, queued, completed] = await Promise.all([
      db.emailCampaign.count({ where: { userId, status: 'RUNNING' } }),
      db.emailCampaign.count({ where: { userId, status: 'QUEUED' } }),
      db.emailCampaign.count({ where: { userId, status: 'COMPLETED' } })
    ]);

    // 2. Scoped Log-based Stats (Emails sent in last 24h by this user)
    const totalSentToday = await db.emailLog.count({
      where: {
        userId,
        sentAt: { gte: twentyFourHoursAgo }
      }
    });

    // 3. Scoped Active Agents Capacity
    const agents = await db.mailerAgent.findMany({ 
      where: { userId, isActive: true },
      select: { dailyLimit: true } 
    });
    const totalCapacity = agents.reduce((sum, agent) => sum + (agent.dailyLimit || 0), 0);
    const activeAgents = agents.length;

    return NextResponse.json({
      campaigns: { running, queued, completed },
      agents: {
        active: activeAgents,
        totalSentToday,
        totalCapacity
      }
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}