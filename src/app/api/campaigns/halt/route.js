import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { id } = await req.json();
  await db.emailCampaign.update({ where: { id }, data: { status: 'HALTED' } });
  return NextResponse.json({ success: true });
}