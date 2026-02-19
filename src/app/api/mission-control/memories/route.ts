import { NextResponse } from 'next/server';
import { db, isConnected } from '@/db';
import { memories } from '@/db/schema';
import { desc, like, or } from 'drizzle-orm';

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

    let allMemories;
    
    if (query) {
      // Search across title and content
      allMemories = await db.select()
        .from(memories)
        .where(
          or(
            like(memories.title, `%${query}%`),
            like(memories.content, `%${query}%`)
          )
        )
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
    const { title, content, tags, conversationRef } = body;

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
