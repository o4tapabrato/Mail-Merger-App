import { processQueue } from '@/lib/campaignWorker';
import { db } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const campaignId = body.id;

    if (campaignId) {
      // If a specific campaign ID was provided, ensure it's marked QUEUED
      await db.emailCampaign.updateMany({
        where: { id: campaignId, userId },
        data: { status: 'QUEUED' }
      });
    }

    // Immediately trigger the queue worker to start sending right now
    const result = await processQueue();

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Direct Send Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}