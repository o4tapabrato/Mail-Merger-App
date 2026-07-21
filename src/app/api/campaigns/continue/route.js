import { processQueue } from '@/lib/campaignWorker';
import { db } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    // Set status back to QUEUED so the worker processes it from lastRowSent
    await db.emailCampaign.update({
      where: { id, userId },
      data: { status: 'QUEUED' }
    });

    // Trigger the worker loop to start sending immediately
    const result = await processQueue();

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Continue Campaign Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}