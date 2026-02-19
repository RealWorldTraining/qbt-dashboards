'use client';

import { useState } from 'react';
import TasksBoard from './components/TasksBoard';
import MemoryViewer from './components/MemoryViewer';
import CalendarView from './components/CalendarView';
import N8nStatus from './components/N8nStatus';
import GoogleAdsQuickView from './components/GoogleAdsQuickView';
import ContentPipeline from './components/ContentPipeline';

export default function MissionControlPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'memory' | 'calendar' | 'n8n' | 'ads' | 'content'>('tasks');

  const tabs = [
    { id: 'tasks' as const, label: 'Tasks Board', icon: '📋' },
    { id: 'memory' as const, label: 'Memory Viewer', icon: '🧠' },
    { id: 'calendar' as const, label: 'Calendar / Cron', icon: '📅' },
    { id: 'n8n' as const, label: 'n8n Workflows', icon: '🔄' },
    { id: 'ads' as const, label: 'Google Ads', icon: '📊' },
    { id: 'content' as const, label: 'Content Pipeline', icon: '🎬' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-3xl font-bold text-gray-900">🎓 Mission Control</h1>
            <p className="text-sm text-gray-600 mt-1">Professor's Command Center</p>
          </div>
          
          {/* Tabs */}
          <nav className="flex space-x-4 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                  transition-colors duration-150
                  ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'tasks' && <TasksBoard />}
        {activeTab === 'memory' && <MemoryViewer />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'n8n' && <N8nStatus />}
        {activeTab === 'ads' && <GoogleAdsQuickView />}
        {activeTab === 'content' && <ContentPipeline />}
      </main>
    </div>
  );
}
