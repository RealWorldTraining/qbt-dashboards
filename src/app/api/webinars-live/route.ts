import { NextResponse } from 'next/server';

const WEBINAR_MACHINE_URL = process.env.WEBINAR_MACHINE_URL || 'https://webinar-machine-production.up.railway.app';

export async function GET() {
  try {
    const response = await fetch(`${WEBINAR_MACHINE_URL}/live`, {
      next: { revalidate: 0 }, // never cache — always fresh
    });

    if (!response.ok) {
      throw new Error(`Webinar Machine returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching live webinar data:', error);
    return NextResponse.json(
      { live: false, webinars: [], error: String(error), fetchedAt: new Date().toISOString() },
      { status: 200 } // return 200 so the frontend doesn't break — just shows empty
    );
  }
}
