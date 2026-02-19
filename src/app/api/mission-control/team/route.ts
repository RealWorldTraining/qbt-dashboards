import { NextResponse } from 'next/server';
import { db, isConnected } from '@/db';
import { teamMembers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/mission-control/team - Fetch all team members
export async function GET() {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({
        error: 'Database not connected',
        mockData: true
      }, { status: 503 });
    }

    const allMembers = await db.select().from(teamMembers).orderBy(desc(teamMembers.createdAt));

    return NextResponse.json({
      members: allMembers,
      mockData: false
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({
      error: 'Failed to fetch team members',
      mockData: true
    }, { status: 500 });
  }
}

// POST /api/mission-control/team - Create new team member
export async function POST(request: Request) {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({
        error: 'Database not connected'
      }, { status: 503 });
    }

    const body = await request.json();
    const { name, role, type, status, avatar, description, responsibilities, currentWork } = body;

    if (!name) {
      return NextResponse.json({
        error: 'Name is required'
      }, { status: 400 });
    }

    const newMember = await db.insert(teamMembers).values({
      name,
      role: role || null,
      type: type || 'human',
      status: status || 'active',
      avatar: avatar || null,
      description: description || null,
      responsibilities: responsibilities || [],
      currentWork: currentWork || null,
      lastActive: new Date(),
    }).returning();

    return NextResponse.json({
      member: newMember[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json({
      error: 'Failed to create team member'
    }, { status: 500 });
  }
}

// PATCH /api/mission-control/team - Update team member
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
        error: 'Member ID is required'
      }, { status: 400 });
    }

    const updatedMember = await db.update(teamMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teamMembers.id, id))
      .returning();

    if (updatedMember.length === 0) {
      return NextResponse.json({
        error: 'Team member not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      member: updatedMember[0]
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({
      error: 'Failed to update team member'
    }, { status: 500 });
  }
}

// DELETE /api/mission-control/team - Delete team member
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
        error: 'Member ID is required'
      }, { status: 400 });
    }

    await db.delete(teamMembers).where(eq(teamMembers.id, parseInt(id)));

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({
      error: 'Failed to delete team member'
    }, { status: 500 });
  }
}
