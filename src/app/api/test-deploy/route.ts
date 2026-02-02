import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'success', 
    message: 'Test deployment working',
    timestamp: new Date().toISOString()
  });
}