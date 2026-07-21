import { db } from '@/lib/prisma'; // Ensure this points to your client
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Force a raw count check
    const count = await db.mailerAgent.count();
    const all = await db.mailerAgent.findMany();
    
    return NextResponse.json({ 
      count, 
      all,
      message: "This is a direct query bypass" 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}