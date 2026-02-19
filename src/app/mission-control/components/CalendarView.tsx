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
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function CalendarView() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schedule: '',
    scheduleHuman: '',
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
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchJobs();
        setFormData({ name: '', description: '', schedule: '', scheduleHuman: '' });
        setShowNewJobForm(false);
      }
    } catch (error) {
      console.error('Error creating cron job:', error);
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

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading cron jobs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📅 Calendar / Cron Jobs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Scheduled tasks and recurring jobs
          </p>
        </div>
        <button
          onClick={() => setShowNewJobForm(!showNewJobForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + New Job
        </button>
      </div>

      {/* New Job Form */}
      {showNewJobForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Create New Cron Job</h3>
          <form onSubmit={createJob} className="space-y-3">
            <input
              type="text"
              placeholder="Job name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <input
              type="text"
              placeholder="Cron schedule (e.g., 0 9 * * 1 for every Monday at 9 AM)"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Human-readable schedule (e.g., Every Monday at 9 AM)"
              value={formData.scheduleHuman}
              onChange={(e) => setFormData({ ...formData, scheduleHuman: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewJobForm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No cron jobs yet. Create your first scheduled task!</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{job.name}</h3>
                  {job.description && (
                    <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleStatus(job.id, job.status)}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}
                >
                  {job.status}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Schedule</div>
                  <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {job.schedule}
                  </div>
                  {job.scheduleHuman && (
                    <div className="text-xs text-gray-600 mt-1">{job.scheduleHuman}</div>
                  )}
                </div>

                <div>
                  <div className="text-gray-500 text-xs mb-1">Last Run</div>
                  <div className="font-medium">{formatDate(job.lastRun)}</div>
                </div>

                <div>
                  <div className="text-gray-500 text-xs mb-1">Next Run</div>
                  <div className="font-medium">{formatDate(job.nextRun)}</div>
                </div>

                <div>
                  <div className="text-gray-500 text-xs mb-1">Created</div>
                  <div className="text-xs">{formatDate(job.createdAt)}</div>
                </div>
              </div>

              {job.errorMessage && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  ⚠️ {job.errorMessage}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
