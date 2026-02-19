'use client';

import { useState, useEffect } from 'react';

type TaskStatus = 'backlog' | 'in_progress' | 'blocked' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignedTo: 'claude',
  });

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/mission-control/tasks');
      const data = await response.json();
      
      if (data.mockData) {
        setUsingMockData(true);
      } else {
        setTasks(data.tasks || []);
        setUsingMockData(false);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    try {
      const response = await fetch('/api/mission-control/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'backlog',
        }),
      });

      if (response.ok) {
        await fetchTasks();
        setFormData({ title: '', description: '', priority: 'medium', assignedTo: 'claude' });
        setShowNewTaskForm(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTask || !formData.title.trim()) return;

    try {
      const response = await fetch('/api/mission-control/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTask.id,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          assignedTo: formData.assignedTo,
        }),
      });

      if (response.ok) {
        await fetchTasks();
        setEditingTask(null);
        setFormData({ title: '', description: '', priority: 'medium', assignedTo: 'claude' });
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/mission-control/tasks?id=${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const response = await fetch('/api/mission-control/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignedTo: task.assignedTo || 'claude',
    });
    setShowNewTaskForm(false);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', priority: 'medium', assignedTo: 'claude' });
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading tasks...</div>
      </div>
    );
  }

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
          onClick={() => {
            setShowNewTaskForm(!showNewTaskForm);
            setEditingTask(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + New Task
        </button>
      </div>

      {/* New/Edit Task Form */}
      {(showNewTaskForm || editingTask) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-3">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h3>
          <form onSubmit={editingTask ? updateTask : createTask} className="space-y-3">
            <input
              type="text"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <select 
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="professor">Assigned to: Professor</option>
                <option value="claude">Assigned to: Claude</option>
                <option value="aaron">Assigned to: Aaron</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewTaskForm(false);
                  cancelEditing();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTask ? 'Save Changes' : 'Create Task'}
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
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
                >
                  {/* Priority Badge + Actions */}
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    
                    {/* Action buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditingTask(task)}
                        className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                        title="Edit task"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                        title="Delete task"
                      >
                        🗑️
                      </button>
                    </div>
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
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span>👤</span>
                      <span>{task.assignedTo}</span>
                    </div>
                  )}

                  {/* Quick status change buttons (shown on hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-wrap">
                    {columns.map(col => 
                      col.status !== task.status && (
                        <button
                          key={col.status}
                          onClick={() => updateTaskStatus(task.id, col.status)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                          title={`Move to ${col.label}`}
                        >
                          {col.emoji}
                        </button>
                      )
                    )}
                  </div>
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
      {usingMockData && (
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Using mock data.</strong> Database connection unavailable.
          </p>
        </div>
      )}
    </div>
  );
}
