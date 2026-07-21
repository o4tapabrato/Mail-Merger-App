import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(req) {
  const { id } = await req.json();
  await db.emailLog.deleteMany({ where: { campaignId: id } });
  await db.emailCampaign.delete({ where: { id } });
  return NextResponse.json({ success: true });
}