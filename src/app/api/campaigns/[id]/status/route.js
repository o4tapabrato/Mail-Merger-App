// src/app/api/agents/route.js
import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const agents = await db.agent.findMany();
  // Ensure we always return an array
  return NextResponse.json(agents || []); 
}

export async function POST(req, { params }) {
  try {
    // Ensure params is awaited correctly for newer Next.js
    const { id } = await params;
    const { status } = await req.json();

    const updated = await db.emailCampaign.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    console.error("Status Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}