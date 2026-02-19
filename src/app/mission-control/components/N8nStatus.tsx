'use client';

import { useState, useEffect } from 'react';

interface Execution {
  id: string;
  startedAt: string;
  stoppedAt: string | null;
  status: string;
}

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  lastExecutionTime: string | null;
  lastExecutionStatus: string | null;
  executionCount: number;
  recentExecutions: Execution[];
  error?: string;
}

export default function N8nStatus() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/mission-control/n8n');
      const data = await response.json();
      
      if (!data.mockData) {
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Error fetching n8n workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (start: string, stop: string | null) => {
    if (!stop) return 'Running...';
    const ms = new Date(stop).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      case 'running':
        return 'bg-blue-600/20 text-blue-700';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'running':
        return '🔄';
      case 'waiting':
        return '⏳';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading n8n workflows...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">🔄 n8n Workflow Status</h2>
        <p className="text-sm text-gray-400 mt-1">
          Live monitoring of key workflows · Auto-refreshes every minute
        </p>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4 hover:shadow-md transition-shadow"
          >
            {/* Workflow Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg text-white">{workflow.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${workflow.active ? 'bg-green-100 text-green-700' : 'bg-gray-800 text-gray-300'}`}>
                    {workflow.active ? 'Active' : 'Inactive'}
                  </span>
                  {workflow.lastExecutionStatus && (
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.lastExecutionStatus)}`}>
                      {getStatusIcon(workflow.lastExecutionStatus)} {workflow.lastExecutionStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Last Execution */}
            {workflow.lastExecutionTime ? (
              <div className="text-sm text-gray-400 mb-3">
                <div className="flex justify-between">
                  <span>Last run:</span>
                  <span className="font-medium">{formatDate(workflow.lastExecutionTime)}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 mb-3">No executions yet</div>
            )}

            {/* Error Message */}
            {workflow.error && (
              <div className="text-sm text-red-600 mb-3">
                ⚠️ {workflow.error}
              </div>
            )}

            {/* Recent Executions Toggle */}
            {workflow.recentExecutions && workflow.recentExecutions.length > 0 && (
              <button
                onClick={() => setExpandedWorkflow(expandedWorkflow === workflow.id ? null : workflow.id)}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {expandedWorkflow === workflow.id ? '▼' : '▶'} Recent Executions ({workflow.executionCount})
              </button>
            )}

            {/* Expanded Executions */}
            {expandedWorkflow === workflow.id && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {workflow.recentExecutions.map((exec) => (
                  <div
                    key={exec.id}
                    className="text-xs bg-[#0a0a0a] rounded p-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full ${getStatusColor(exec.status)}`}>
                        {getStatusIcon(exec.status)} {exec.status}
                      </span>
                      <span className="text-gray-500">
                        {getDuration(exec.startedAt, exec.stoppedAt)}
                      </span>
                    </div>
                    <div className="text-gray-400 mt-1">
                      {formatDate(exec.startedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
