import { processQueue } from '@/lib/orchestrator';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await processQueue();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}