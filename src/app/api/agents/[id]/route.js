import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await db.mailerAgent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const { isActive } = await req.json();
    const updatedAgent = await db.mailerAgent.update({
      where: { id },
      data: { isActive }, // Note: Ensure 'isActive' exists in your schema
    });
    return NextResponse.json({ success: true, agent: updatedAgent });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}