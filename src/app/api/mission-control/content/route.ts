import { NextResponse } from 'next/server';
import { db, isConnected } from '@/db';
import { contentPipeline } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/mission-control/content - Fetch all content items
export async function GET() {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({ 
        error: 'Database not connected',
        mockData: true 
      }, { status: 503 });
    }

    const allContent = await db.select().from(contentPipeline).orderBy(desc(contentPipeline.createdAt));
    
    return NextResponse.json({ 
      content: allContent,
      mockData: false 
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch content',
      mockData: true 
    }, { status: 500 });
  }
}

// POST /api/mission-control/content - Create new content item
export async function POST(request: Request) {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({ 
        error: 'Database not connected' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { title, platform, script, notes, dueDate } = body;

    if (!title) {
      return NextResponse.json({ 
        error: 'Title is required' 
      }, { status: 400 });
    }

    const newContent = await db.insert(contentPipeline).values({
      title,
      platform: platform || null,
      script: script || null,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'ideas',
    }).returning();

    return NextResponse.json({ 
      content: newContent[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({ 
      error: 'Failed to create content' 
    }, { status: 500 });
  }
}

// PATCH /api/mission-control/content - Update content item
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
        error: 'Content ID is required' 
      }, { status: 400 });
    }

    // Handle date fields
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }
    if (updates.publishedAt) {
      updates.publishedAt = new Date(updates.publishedAt);
    }

    const updatedContent = await db.update(contentPipeline)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentPipeline.id, id))
      .returning();

    if (updatedContent.length === 0) {
      return NextResponse.json({ 
        error: 'Content not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      content: updatedContent[0] 
    });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ 
      error: 'Failed to update content' 
    }, { status: 500 });
  }
}
