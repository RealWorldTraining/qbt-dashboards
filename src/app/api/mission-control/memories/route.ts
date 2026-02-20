import { NextResponse } from 'next/server';
import { db, isConnected } from '@/db';
import { memories } from '@/db/schema';
import { desc, like, or, eq, and, SQL } from 'drizzle-orm';

// GET /api/mission-control/memories - Fetch all memories (with optional search)
export async function GET(request: Request) {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({ 
        error: 'Database not connected',
        mockData: true 
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const projectFilter = searchParams.get('project');
    const agentFilter = searchParams.get('agent');

    // Build conditions array
    const conditions: SQL[] = [];

    if (query) {
      const searchCondition = or(
        like(memories.title, `%${query}%`),
        like(memories.content, `%${query}%`)
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    if (projectFilter) {
      conditions.push(eq(memories.project, projectFilter));
    }

    if (agentFilter) {
      conditions.push(eq(memories.createdBy, agentFilter));
    }

    let allMemories;

    if (conditions.length > 0) {
      allMemories = await db.select()
        .from(memories)
        .where(and(...conditions))
        .orderBy(desc(memories.createdAt));
    } else {
      allMemories = await db.select()
        .from(memories)
        .orderBy(desc(memories.createdAt));
    }
    
    return NextResponse.json({ 
      memories: allMemories,
      mockData: false 
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch memories',
      mockData: true 
    }, { status: 500 });
  }
}

// POST /api/mission-control/memories - Create new memory
export async function POST(request: Request) {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({ 
        error: 'Database not connected' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { title, content, tags, conversationRef, category, project, createdBy } = body;

    if (!title || !content) {
      return NextResponse.json({
        error: 'Title and content are required'
      }, { status: 400 });
    }

    const newMemory = await db.insert(memories).values({
      title,
      content,
      tags: tags || [],
      conversationRef: conversationRef || null,
      category: category || null,
      project: project || null,
      createdBy: createdBy || null,
    }).returning();

    return NextResponse.json({
      memory: newMemory[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json({
      error: 'Failed to create memory'
    }, { status: 500 });
  }
}

// PATCH /api/mission-control/memories - Update memory
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
        error: 'Memory ID is required'
      }, { status: 400 });
    }

    const updatedMemory = await db.update(memories)
      .set(updates)
      .where(eq(memories.id, id))
      .returning();

    if (updatedMemory.length === 0) {
      return NextResponse.json({
        error: 'Memory not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      memory: updatedMemory[0]
    });
  } catch (error) {
    console.error('Error updating memory:', error);
    return NextResponse.json({
      error: 'Failed to update memory'
    }, { status: 500 });
  }
}

// DELETE /api/mission-control/memories - Delete memory
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
        error: 'Memory ID is required'
      }, { status: 400 });
    }

    await db.delete(memories).where(eq(memories.id, parseInt(id)));

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json({
      error: 'Failed to delete memory'
    }, { status: 500 });
  }
}
