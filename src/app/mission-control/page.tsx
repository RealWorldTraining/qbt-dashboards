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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <span className="text-5xl">🎓</span>
              Mission Control
            </h1>
            <p className="text-gray-400 mt-2">Professor's Command Center</p>
          </div>
          
          {/* Tabs */}
          <nav className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-5 py-3 rounded-t-lg text-sm font-medium whitespace-nowrap
                  transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-[#0a0a0a] text-cyan-400 border-t-2 border-cyan-400 shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                  }
                `}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="py-8 w-full">
        <div className={`animate-preview-in mx-auto w-full ${
          activeTab === 'tasks' ? 'max-w-[1400px] px-6' : 'max-w-7xl px-4 sm:px-6 lg:px-8'
        }`}>
          {activeTab === 'tasks' && <TasksBoard />}
          {activeTab === 'memory' && <MemoryViewer />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'n8n' && <N8nStatus />}
          {activeTab === 'ads' && <GoogleAdsQuickView />}
          {activeTab === 'content' && <ContentPipeline />}
        </div>
      </main>
    </div>
  );
}
