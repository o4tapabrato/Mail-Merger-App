import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Retrieve campaign
export async function GET(req, { params }) {
  const { id } = await params;
  const campaign = await db.emailCampaign.findUnique({ where: { id } });
  return NextResponse.json(campaign);
}

// PUT: Update campaign
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, template, fileData } = body;

    const updatedCampaign = await db.emailCampaign.update({
      where: { id },
      data: {
        name,
        subject: template.subject,
        cc: template.cc,
        bcc: template.bcc,
        body: template.body,
        fileData: fileData,
        assignedAgentId: template.assignedAgentId || '',
        priority: template.priority ?? 0
      },
    });

    return NextResponse.json({ success: true, campaign: updatedCampaign });
  } catch (error) {
    console.error("PUT API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}