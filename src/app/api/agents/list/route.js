import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // ONLY fetch agents belonging to THIS user
    const agents = await db.mailerAgent.findMany({ 
      where: { userId, isActive: true } 
    });

    const enrichedAgents = await Promise.all(agents.map(async (agent) => {
      const sentCount = await db.emailLog.count({
        where: {
          userId: userId, // Ensure we only count this user's logs
          agentId: agent.id,
          sentAt: { gte: twentyFourHoursAgo }
        }
      });
      return { ...agent, sentCount };
    }));

    return NextResponse.json(enrichedAgents);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}