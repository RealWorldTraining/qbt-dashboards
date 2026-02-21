import { NextRequest, NextResponse } from 'next/server';

const WEBINAR_MACHINE_URL = process.env.WEBINAR_MACHINE_URL || 'https://webinar-machine-production.up.railway.app';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const webinarId    = searchParams.get('webinarId');
  const occurrenceId = searchParams.get('occurrence_id');

  if (!webinarId) {
    return NextResponse.json({ error: 'webinarId required' }, { status: 400 });
  }

  try {
    const params = new URLSearchParams();
    if (occurrenceId) params.set('occurrence_id', occurrenceId);

    const response = await fetch(
      `${WEBINAR_MACHINE_URL}/registrants/${webinarId}?${params}`,
      { next: { revalidate: 0 } }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: String(error), total: 0, registrants: [] },
      { status: 200 }
    );
  }
}
