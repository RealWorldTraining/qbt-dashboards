'use client';

import { useState, useEffect, useMemo } from 'react';

type TaskStatus = 'backlog' | 'in_progress' | 'blocked' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string | null;
  dueDate?: Date | null;
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

const priorityBorders: Record<TaskPriority, string> = {
  low: 'border-l-gray-600',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
};

interface TeamMember {
  id: number;
  name: string;
  avatar: string | null;
  type: string;
}

interface Assignee {
  value: string;
  label: string;
  avatar: string | null;
}

const FALLBACK_ASSIGNEES: Assignee[] = [
  { value: 'Professor', label: 'Professor', avatar: null },
  { value: 'Claude Code', label: 'Claude Code', avatar: null },
  { value: 'Aaron', label: 'Aaron', avatar: null },
];

export default function TasksBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>(FALLBACK_ASSIGNEES);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignedTo: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/mission-control/team');
      const data = await response.json();
      if (data.members && data.members.length > 0) {
        const teamAssignees: Assignee[] = data.members.map((m: TeamMember) => ({
          value: m.name,
          label: m.name,
          avatar: m.avatar,
        }));
        setAssignees(teamAssignees);
        if (!formData.assignedTo) {
          setFormData(prev => ({ ...prev, assignedTo: teamAssignees[0].value }));
        }
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

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
          dueDate: formData.dueDate || null,
        }),
      });

      if (response.ok) {
        await fetchTasks();
        setFormData({ title: '', description: '', priority: 'medium', assignedTo: assignees[0]?.value || '', dueDate: '' });
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
          dueDate: formData.dueDate || null,
        }),
      });

      if (response.ok) {
        await fetchTasks();
        setEditingTask(null);
        setFormData({ title: '', description: '', priority: 'medium', assignedTo: assignees[0]?.value || '', dueDate: '' });
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
      assignedTo: task.assignedTo || assignees[0]?.value || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    });
    setShowNewTaskForm(false);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', priority: 'medium', assignedTo: assignees[0]?.value || '', dueDate: '' });
  };

  const getFilteredTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    if (priorityFilter) {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    if (assigneeFilter) {
      filtered = filtered.filter(t => t.assignedTo === assigneeFilter);
    }
    return filtered;
  }, [tasks, priorityFilter, assigneeFilter]);

  const getDueDateInfo = (dueDate: Date | null | undefined) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: 'text-red-400 bg-red-600/20' };
    if (diffDays === 0) return { label: 'Due today', color: 'text-yellow-400 bg-yellow-600/20' };
    if (diffDays <= 7) return { label: `${diffDays}d left`, color: 'text-cyan-400 bg-cyan-600/20' };
    return { label: `${diffDays}d left`, color: 'text-gray-400 bg-gray-800' };
  };

  const getAssigneeAvatar = (name: string | null | undefined) => {
    if (!name) return null;
    const assignee = assignees.find(a => a.value === name);
    const avatar = assignee?.avatar;
    if (avatar && (avatar.startsWith('/') || avatar.startsWith('http'))) {
      return avatar;
    }
    return null;
  };

  const renderAvatar = (name: string | null | undefined, size: string = 'w-6 h-6') => {
    const avatarUrl = getAssigneeAvatar(name);
    if (avatarUrl) {
      return <img src={avatarUrl} alt={name || ''} className={`${size} rounded-full object-cover`} />;
    }
    return <span className="text-sm">👤</span>;
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

      {/* Team Roster + Priority Filter */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Team</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Priority:</span>
              <div className="flex gap-1">
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                      priorityFilter === p
                        ? priorityColors[p] + ' ring-1 ring-current'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {(priorityFilter || assigneeFilter) && (
              <button
                onClick={() => { setPriorityFilter(null); setAssigneeFilter(null); }}
                className="text-xs px-3 py-1.5 bg-gray-800 text-gray-400 rounded-full hover:text-white"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          {assignees.map(a => {
            const isSelected = assigneeFilter === a.value;
            const avatarUrl = getAssigneeAvatar(a.value);
            const memberTasks = tasks.filter(t => t.assignedTo === a.value && t.status !== 'done');
            return (
              <button
                key={a.value}
                onClick={() => setAssigneeFilter(isSelected ? null : a.value)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-cyan-600/15 ring-2 ring-cyan-500 scale-105'
                    : 'hover:bg-gray-800/60'
                }`}
              >
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={a.value}
                      className={`w-12 h-12 rounded-full object-cover transition-all ${
                        isSelected ? 'ring-2 ring-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.4)]' : 'ring-1 ring-gray-700'
                      }`}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl ${
                      isSelected ? 'ring-2 ring-cyan-400' : 'ring-1 ring-gray-700'
                    }`}>
                      👤
                    </div>
                  )}
                  {memberTasks.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {memberTasks.length}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium truncate max-w-[72px] ${
                  isSelected ? 'text-cyan-400' : 'text-gray-400'
                }`}>
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>
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
            <div className="grid grid-cols-3 gap-4">
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
                {assignees.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                title="Due date"
              />
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
      <div className="grid grid-cols-4 gap-4">
        {columns.map(column => (
          <div key={column.status} className="bg-[#1a1a1a] rounded-lg overflow-hidden shadow-xl min-w-0">
            {/* Column Header with accent color */}
            <div className={`h-1 ${column.color}`} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2 text-lg">
                  <span className="text-xl">{column.emoji}</span>
                  {column.label}
                </h3>
                <span className="text-sm text-gray-400 bg-[#0a0a0a] px-3 py-1 rounded-full font-medium">
                  {getFilteredTasksByStatus(column.status).length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {getFilteredTasksByStatus(column.status).map(task => (
                  <div
                    key={task.id}
                    className={`bg-[#0a0a0a] rounded-lg p-4 border border-gray-800 border-l-4 ${priorityBorders[task.priority]} hover:border-gray-700 hover:shadow-lg transition-all group`}
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

                    {/* Due Date */}
                    {task.dueDate && (() => {
                      const info = getDueDateInfo(task.dueDate);
                      return info ? (
                        <div className={`text-xs px-2 py-1 rounded-full inline-block mb-2 ${info.color}`}>
                          📅 {info.label}
                        </div>
                      ) : null;
                    })()}

                    {/* Assigned To */}
                    {task.assignedTo && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        {renderAvatar(task.assignedTo, 'w-5 h-5')}
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

                {getFilteredTasksByStatus(column.status).length === 0 && (
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
