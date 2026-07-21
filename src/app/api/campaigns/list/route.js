import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaigns = await db.emailCampaign.findMany({
      where: { userId },
      include: { logs: true }, // <--- CRITICAL: Include logs relation
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Campaign List Error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}