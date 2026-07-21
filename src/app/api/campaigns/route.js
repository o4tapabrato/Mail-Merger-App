import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';

export async function POST(req) {
  try {
    // 2. Get the logged-in user's ID from the session cookie
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, template, fileData } = body;

    // 3. Include userId in the create payload
    const campaign = await db.emailCampaign.create({
      data: {
        name: name || "Untitled Campaign",
        subject: template?.subject || "",
        cc: template?.cc || "",
        bcc: template?.bcc || "",
        body: template?.body || "",
        assignedAgentId: template?.assignedAgentId || "",
        priority: body.priority || 0,
        fileData: fileData, 
        userId: userId, // <--- Crucial: Links the campaign to the logged-in user
      }
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}