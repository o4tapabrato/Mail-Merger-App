import { processQueue } from '@/lib/campaignWorker';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { campaignId } = await req.json();
  // We don't await the processCampaign here so it stays in background
  processCampaign(campaignId).catch(console.error);
  return NextResponse.json({ success: true });
}