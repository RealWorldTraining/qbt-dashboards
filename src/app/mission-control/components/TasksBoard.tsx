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

const columns: { status: TaskStatus; label: string; emoji: string; color: string }[] = [
  { status: 'backlog', label: 'Backlog', emoji: '📋', color: 'bg-gray-600' },
  { status: 'in_progress', label: 'In Progress', emoji: '🚀', color: 'bg-blue-500' },
  { status: 'blocked', label: 'Blocked', emoji: '🚧', color: 'bg-yellow-500' },
  { status: 'done', label: 'Done', emoji: '✅', color: 'bg-green-500' },
];

const priorityColors = {
  low: 'bg-gray-700 text-gray-300',
  medium: 'bg-blue-600 text-blue-100',
  high: 'bg-orange-600 text-orange-100',
  urgent: 'bg-red-600 text-red-100',
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
    assignedTo: 'professor',
  });

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
        setFormData({ title: '', description: '', priority: 'medium', assignedTo: 'professor' });
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
        setFormData({ title: '', description: '', priority: 'medium', assignedTo: 'professor' });
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
      assignedTo: task.assignedTo || 'professor',
    });
    setShowNewTaskForm(false);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', priority: 'medium', assignedTo: 'professor' });
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>📋</span> Tasks Board
          </h2>
          <p className="text-gray-400 mt-1">
            Track active work and projects
          </p>
        </div>
        <button
          onClick={() => {
            setShowNewTaskForm(!showNewTaskForm);
            setEditingTask(null);
          }}
          className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all font-medium shadow-lg hover:shadow-cyan-600/50"
        >
          + New Task
        </button>
      </div>

      {/* New/Edit Task Form */}
      {(showNewTaskForm || editingTask) && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl">
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-lg -m-6 mb-4" />
          <h3 className="font-semibold text-white text-lg mb-4">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h3>
          <form onSubmit={editingTask ? updateTask : createTask} className="space-y-4">
            <input
              type="text"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <select 
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
              >
                <option value="professor">👤 Professor</option>
                <option value="claude">🤖 Claude</option>
                <option value="aaron">👨‍💼 Aaron</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewTaskForm(false);
                  cancelEditing();
                }}
                className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all font-medium shadow-lg"
              >
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {columns.map(column => (
          <div key={column.status} className="bg-[#1a1a1a] rounded-lg overflow-hidden shadow-xl">
            {/* Column Header with accent color */}
            <div className={`h-1 ${column.color}`} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2 text-lg">
                  <span className="text-xl">{column.emoji}</span>
                  {column.label}
                </h3>
                <span className="text-sm text-gray-400 bg-[#0a0a0a] px-3 py-1 rounded-full font-medium">
                  {getTasksByStatus(column.status).length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {getTasksByStatus(column.status).map(task => (
                  <div
                    key={task.id}
                    className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800 hover:border-gray-700 hover:shadow-lg transition-all group"
                  >
                    {/* Priority Badge + Actions */}
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      
                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditingTask(task)}
                          className="text-xs px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-all"
                          title="Edit task"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-xs px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-all"
                          title="Delete task"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Task Title */}
                    <h4 className="font-semibold text-white mb-2 text-sm">
                      {task.title}
                    </h4>

                    {/* Description */}
                    {task.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Assigned To */}
                    {task.assignedTo && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span>👤</span>
                        <span className="text-gray-400">{task.assignedTo}</span>
                      </div>
                    )}

                    {/* Quick status change buttons */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 flex-wrap pt-2 border-t border-gray-800">
                      {columns.map(col => 
                        col.status !== task.status && (
                          <button
                            key={col.status}
                            onClick={() => updateTaskStatus(task.id, col.status)}
                            className="text-xs px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-all"
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
                  <p className="text-sm text-gray-500 text-center py-12">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Database Status */}
      {usingMockData && (
        <div className="mt-6 p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
          <p className="text-sm text-yellow-400">
            ⚠️ <strong>Using mock data.</strong> Database connection unavailable.
          </p>
        </div>
      )}
    </div>
  );
}
