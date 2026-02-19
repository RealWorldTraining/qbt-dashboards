'use client';

import { useState } from 'react';

type TaskStatus = 'backlog' | 'in_progress' | 'blocked' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data (will replace with real database once connected)
const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Build Mission Control Tasks Board',
    description: 'Create Kanban board for task tracking',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'claude',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    title: 'Set up Neon database',
    description: 'Configure Postgres database for Mission Control',
    status: 'done',
    priority: 'high',
    assignedTo: 'aaron',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    title: 'Build Memory Viewer component',
    description: 'Searchable log of memories and decisions',
    status: 'backlog',
    priority: 'medium',
    assignedTo: 'claude',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const columns: { status: TaskStatus; label: string; emoji: string }[] = [
  { status: 'backlog', label: 'Backlog', emoji: '📋' },
  { status: 'in_progress', label: 'In Progress', emoji: '🚀' },
  { status: 'blocked', label: 'Blocked', emoji: '🚧' },
  { status: 'done', label: 'Done', emoji: '✅' },
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function TasksBoard() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📋 Tasks Board</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track active work and projects
          </p>
        </div>
        <button
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + New Task
        </button>
      </div>

      {/* New Task Form */}
      {showNewTaskForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Create New Task</h3>
          <form className="space-y-3">
            <input
              type="text"
              placeholder="Task title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="claude">Assigned to: Claude</option>
                <option value="aaron">Assigned to: Aaron</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewTaskForm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => (
          <div key={column.status} className="bg-gray-50 rounded-lg p-4">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>{column.emoji}</span>
                {column.label}
              </h3>
              <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                {getTasksByStatus(column.status).length}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {getTasksByStatus(column.status).map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Priority Badge */}
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>

                  {/* Task Title */}
                  <h4 className="font-medium text-gray-900 mb-1">
                    {task.title}
                  </h4>

                  {/* Description */}
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Assigned To */}
                  {task.assignedTo && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>👤</span>
                      <span>{task.assignedTo}</span>
                    </div>
                  )}
                </div>
              ))}

              {getTasksByStatus(column.status).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  No tasks
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Database Status */}
      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Using mock data.</strong> Once DATABASE_URL is available, tasks will persist to Neon Postgres.
        </p>
      </div>
    </div>
  );
}
