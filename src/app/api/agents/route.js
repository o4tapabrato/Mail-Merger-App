// app/api/agents/route.js
import { db } from '../../../lib/prisma';
import { encrypt } from '../../../lib/crypto';
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '../../../lib/auth';

export async function POST(request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const newAgent = await db.mailerAgent.create({
      data: {
        email: body.email,
        password: body.password, // <--- Added missing password field required by schema
        dailyLimit: parseInt(body.dailyLimit, 10) || 500, // <--- Converted to Int
        userId: userId, 
      }
    });

    return NextResponse.json({ success: true, agent: newAgent });
  } catch (error) {
    console.error("Create agent error:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized", agents: [] }, { status: 401 });
    }

    const agents = await db.mailerAgent.findMany({
      where: { userId }
    });
    
    return NextResponse.json({ 
      success: true, 
      agents: agents 
    });
  } catch(error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json({ success: false, agents: [] }, { status: 500 });
  }
}