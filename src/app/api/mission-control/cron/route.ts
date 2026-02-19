import { NextResponse } from 'next/server';
import { db, isConnected } from '@/db';
import { cronJobs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/mission-control/cron - Fetch all cron jobs
export async function GET() {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({ 
        error: 'Database not connected',
        mockData: true 
      }, { status: 503 });
    }

    const allJobs = await db.select().from(cronJobs).orderBy(desc(cronJobs.createdAt));
    
    return NextResponse.json({ 
      jobs: allJobs,
      mockData: false 
    });
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cron jobs',
      mockData: true 
    }, { status: 500 });
  }
}

// POST /api/mission-control/cron - Create new cron job
export async function POST(request: Request) {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({ 
        error: 'Database not connected' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { name, description, schedule, scheduleHuman } = body;

    if (!name || !schedule) {
      return NextResponse.json({ 
        error: 'Name and schedule are required' 
      }, { status: 400 });
    }

    const newJob = await db.insert(cronJobs).values({
      name,
      description: description || null,
      schedule,
      scheduleHuman: scheduleHuman || null,
      status: 'active',
    }).returning();

    return NextResponse.json({ 
      job: newJob[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating cron job:', error);
    return NextResponse.json({ 
      error: 'Failed to create cron job' 
    }, { status: 500 });
  }
}

// PATCH /api/mission-control/cron - Update cron job
export async function PATCH(request: Request) {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({ 
        error: 'Database not connected' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'Job ID is required' 
      }, { status: 400 });
    }

    const updatedJob = await db.update(cronJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cronJobs.id, id))
      .returning();

    if (updatedJob.length === 0) {
      return NextResponse.json({ 
        error: 'Job not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      job: updatedJob[0]
    });
  } catch (error) {
    console.error('Error updating cron job:', error);
    return NextResponse.json({
      error: 'Failed to update cron job'
    }, { status: 500 });
  }
}

// DELETE /api/mission-control/cron - Delete cron job
export async function DELETE(request: Request) {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({
        error: 'Database not connected'
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        error: 'Job ID is required'
      }, { status: 400 });
    }

    await db.delete(cronJobs).where(eq(cronJobs.id, parseInt(id)));

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting cron job:', error);
    return NextResponse.json({
      error: 'Failed to delete cron job'
    }, { status: 500 });
  }
}
