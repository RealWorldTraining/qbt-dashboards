import { NextResponse } from 'next/server';
import { db, isConnected } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/mission-control/tasks - Fetch all tasks
export async function GET() {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({ 
        error: 'Database not connected',
        mockData: true 
      }, { status: 503 });
    }

    const allTasks = await db.select().from(tasks).orderBy(tasks.createdAt);
    
    return NextResponse.json({ 
      tasks: allTasks,
      mockData: false 
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tasks',
      mockData: true 
    }, { status: 500 });
  }
}

// POST /api/mission-control/tasks - Create new task
export async function POST(request: Request) {
  try {
    if (!isConnected || !db) {
      return NextResponse.json({ 
        error: 'Database not connected' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { title, description, status, priority, assignedTo } = body;

    if (!title) {
      return NextResponse.json({ 
        error: 'Title is required' 
      }, { status: 400 });
    }

    const newTask = await db.insert(tasks).values({
      title,
      description: description || null,
      status: status || 'backlog',
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
    }).returning();

    return NextResponse.json({ 
      task: newTask[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: 'Failed to create task' 
    }, { status: 500 });
  }
}

// PATCH /api/mission-control/tasks - Update task
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
        error: 'Task ID is required' 
      }, { status: 400 });
    }

    const updatedTask = await db.update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    if (updatedTask.length === 0) {
      return NextResponse.json({ 
        error: 'Task not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      task: updatedTask[0] 
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ 
      error: 'Failed to update task' 
    }, { status: 500 });
  }
}

// DELETE /api/mission-control/tasks - Delete task
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
        error: 'Task ID is required' 
      }, { status: 400 });
    }

    await db.delete(tasks).where(eq(tasks.id, parseInt(id)));

    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ 
      error: 'Failed to delete task' 
    }, { status: 500 });
  }
}
