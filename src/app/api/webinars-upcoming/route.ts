import { NextResponse } from 'next/server';

const WEBINAR_MACHINE_URL = process.env.WEBINAR_MACHINE_URL || 'https://webinar-machine-production.up.railway.app';

export async function GET() {
  try {
    const response = await fetch(`${WEBINAR_MACHINE_URL}/upcoming?days=10`, {
      next: { revalidate: 0 },
    });
    if (!response.ok) throw new Error(`Webinar Machine returned ${response.status}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching upcoming webinars:', error);
    return NextResponse.json(
      { count: 0, webinars: [], error: String(error), fetchedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
