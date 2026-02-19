'use client';

import { useState, useEffect } from 'react';

interface CronJob {
  id: number;
  name: string;
  description: string | null;
  schedule: string;
  scheduleHuman: string | null;
  lastRun: Date | null;
  nextRun: Date | null;
  status: string;
  n8nWorkflowId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function CalendarView() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schedule: '',
    scheduleHuman: '',
    n8nWorkflowId: '',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/mission-control/cron');
      const data = await response.json();

      if (!data.mockData) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching cron jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.schedule.trim()) return;

    try {
      const response = await fetch('/api/mission-control/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          schedule: formData.schedule,
          scheduleHuman: formData.scheduleHuman || null,
          n8nWorkflowId: formData.n8nWorkflowId || null,
        }),
      });

      if (response.ok) {
        await fetchJobs();
        resetForm();
        setShowNewJobForm(false);
      }
    } catch (error) {
      console.error('Error creating cron job:', error);
    }
  };

  const updateJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingJob || !formData.name.trim()) return;

    try {
      const response = await fetch('/api/mission-control/cron', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingJob.id,
          name: formData.name,
          description: formData.description || null,
          schedule: formData.schedule,
          scheduleHuman: formData.scheduleHuman || null,
          n8nWorkflowId: formData.n8nWorkflowId || null,
        }),
      });

      if (response.ok) {
        await fetchJobs();
        resetForm();
        setEditingJob(null);
      }
    } catch (error) {
      console.error('Error updating cron job:', error);
    }
  };

  const toggleStatus = async (jobId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    try {
      const response = await fetch('/api/mission-control/cron', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, status: newStatus }),
      });

      if (response.ok) {
        await fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const deleteJob = async (jobId: number) => {
    if (!confirm('Delete this cron job?')) return;

    try {
      const response = await fetch(`/api/mission-control/cron?id=${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchJobs();
      }
    } catch (error) {
      console.error('Error deleting cron job:', error);
    }
  };

  const startEditing = (job: CronJob) => {
    setEditingJob(job);
    setFormData({
      name: job.name,
      description: job.description || '',
      schedule: job.schedule,
      scheduleHuman: job.scheduleHuman || '',
      n8nWorkflowId: job.n8nWorkflowId || '',
    });
    setShowNewJobForm(false);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', schedule: '', scheduleHuman: '', n8nWorkflowId: '' });
  };

  const getRelativeTime = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const d = new Date(date);
    const diffMs = d.getTime() - now.getTime();
    const absDiffMs = Math.abs(diffMs);
    const isPast = diffMs < 0;

    if (absDiffMs < 60000) return 'just now';
    if (absDiffMs < 3600000) {
      const mins = Math.floor(absDiffMs / 60000);
      return isPast ? `${mins}m ago` : `in ${mins}m`;
    }
    if (absDiffMs < 86400000) {
      const hrs = Math.floor(absDiffMs / 3600000);
      return isPast ? `${hrs}h ago` : `in ${hrs}h`;
    }
    const days = Math.floor(absDiffMs / 86400000);
    return isPast ? `${days}d ago` : `in ${days}d`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-600/20 text-green-400', dot: 'bg-green-400' };
      case 'paused':
        return { color: 'bg-yellow-600/20 text-yellow-400', dot: 'bg-yellow-400' };
      case 'error':
        return { color: 'bg-red-600/20 text-red-400', dot: 'bg-red-400' };
      default:
        return { color: 'bg-gray-800 text-gray-300', dot: 'bg-gray-400' };
    }
  };

  // Simple cron next-run preview (approximation for common patterns)
  const getCronPreview = (schedule: string): string[] => {
    // This is a simplified preview — shows the schedule pattern description
    const parts = schedule.trim().split(/\s+/);
    if (parts.length !== 5) return [];

    const previews: string[] = [];
    const now = new Date();

    // Generate approximate next 3 runs based on simple cron patterns
    for (let i = 0; i < 3; i++) {
      const next = new Date(now);
      next.setDate(next.getDate() + i);
      // Set hour/minute from cron if they're specific numbers
      const minute = parts[0] !== '*' ? parseInt(parts[0]) : 0;
      const hour = parts[1] !== '*' ? parseInt(parts[1]) : 9;
      if (!isNaN(minute)) next.setMinutes(minute);
      if (!isNaN(hour)) next.setHours(hour);
      next.setSeconds(0);

      if (next > now) {
        previews.push(next.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }));
      }

      if (previews.length >= 3) break;
    }

    return previews;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading cron jobs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>📅</span> Calendar / Cron Jobs
          </h2>
          <p className="text-gray-400 mt-1">
            Scheduled tasks and recurring jobs
          </p>
        </div>
        <button
          onClick={() => {
            setShowNewJobForm(!showNewJobForm);
            setEditingJob(null);
            resetForm();
          }}
          className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all font-medium shadow-lg hover:shadow-cyan-600/50"
        >
          + New Job
        </button>
      </div>

      {/* New/Edit Job Form */}
      {(showNewJobForm || editingJob) && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl">
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-green-500 rounded-t-lg -m-6 mb-4" />
          <h3 className="font-semibold text-white text-lg mb-4">
            {editingJob ? 'Edit Cron Job' : 'Create New Cron Job'}
          </h3>
          <form onSubmit={editingJob ? updateJob : createJob} className="space-y-4">
            <input
              type="text"
              placeholder="Job name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Cron schedule (e.g., 0 9 * * 1)"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white font-mono placeholder-gray-500"
                required
              />
              <input
                type="text"
                placeholder="Human-readable (e.g., Every Monday at 9 AM)"
                value={formData.scheduleHuman}
                onChange={(e) => setFormData({ ...formData, scheduleHuman: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
              />
            </div>
            <input
              type="text"
              placeholder="n8n Workflow ID (optional)"
              value={formData.n8nWorkflowId}
              onChange={(e) => setFormData({ ...formData, n8nWorkflowId: e.target.value })}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />

            {/* Cron Preview */}
            {formData.schedule && getCronPreview(formData.schedule).length > 0 && (
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Next runs (approx):</div>
                {getCronPreview(formData.schedule).map((preview, i) => (
                  <div key={i} className="text-sm text-gray-300 font-mono">{preview}</div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewJobForm(false);
                  setEditingJob(null);
                  resetForm();
                }}
                className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all font-medium shadow-lg"
              >
                {editingJob ? 'Save Changes' : 'Create Job'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8 text-center">
            <p className="text-gray-500">No cron jobs yet. Create your first scheduled task!</p>
          </div>
        ) : (
          jobs.map((job) => {
            const statusConfig = getStatusConfig(job.status);
            return (
              <div
                key={job.id}
                className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white">{job.name}</h3>
                    {job.description && (
                      <p className="text-sm text-gray-400 mt-1">{job.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(job.id, job.status)}
                      className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${statusConfig.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {job.status}
                    </button>
                    <button
                      onClick={() => startEditing(job)}
                      className="text-xs px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-all opacity-0 group-hover:opacity-100"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="text-xs px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-all opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Schedule</div>
                    <div className="font-mono text-xs bg-[#0a0a0a] border border-gray-800 px-2 py-1 rounded text-gray-300">
                      {job.schedule}
                    </div>
                    {job.scheduleHuman && (
                      <div className="text-xs text-gray-400 mt-1">{job.scheduleHuman}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-gray-500 text-xs mb-1">Last Run</div>
                    <div className="font-medium text-gray-300">{formatDate(job.lastRun)}</div>
                    {job.lastRun && (
                      <div className="text-xs text-gray-500">{getRelativeTime(job.lastRun)}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-gray-500 text-xs mb-1">Next Run</div>
                    <div className="font-medium text-gray-300">{formatDate(job.nextRun)}</div>
                    {job.nextRun && (
                      <div className="text-xs text-cyan-400">{getRelativeTime(job.nextRun)}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-gray-500 text-xs mb-1">
                      {job.n8nWorkflowId ? 'n8n Workflow' : 'Created'}
                    </div>
                    {job.n8nWorkflowId ? (
                      <div className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded inline-block">
                        🔄 #{job.n8nWorkflowId}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">{formatDate(job.createdAt)}</div>
                    )}
                  </div>
                </div>

                {job.errorMessage && (
                  <div className="mt-3 p-2 bg-red-600/10 border border-red-600/30 rounded text-sm text-red-400">
                    ⚠️ {job.errorMessage}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
