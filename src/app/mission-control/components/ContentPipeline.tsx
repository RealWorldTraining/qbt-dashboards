'use client';

import { useState, useEffect } from 'react';

type ContentStatus = 'ideas' | 'scripting' | 'review' | 'ready_to_film' | 'published';

interface ContentItem {
  id: number;
  title: string;
  platform: string | null;
  status: ContentStatus;
  script: string | null;
  thumbnailUrl: string | null;
  notes: string | null;
  dueDate: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const columns: { status: ContentStatus; label: string; emoji: string }[] = [
  { status: 'ideas', label: 'Ideas', emoji: '💡' },
  { status: 'scripting', label: 'Scripting', emoji: '✍️' },
  { status: 'review', label: 'Review', emoji: '👀' },
  { status: 'ready_to_film', label: 'Ready to Film', emoji: '🎥' },
  { status: 'published', label: 'Published', emoji: '✅' },
];

export default function ContentPipeline() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [showNewContentForm, setShowNewContentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    platform: 'youtube',
    script: '',
    notes: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/mission-control/content');
      const data = await response.json();
      
      if (!data.mockData) {
        setContent(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const createContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    try {
      const response = await fetch('/api/mission-control/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchContent();
        setFormData({ title: '', platform: 'youtube', script: '', notes: '', dueDate: '' });
        setShowNewContentForm(false);
      }
    } catch (error) {
      console.error('Error creating content:', error);
    }
  };

  const updateContentStatus = async (contentId: number, newStatus: ContentStatus) => {
    try {
      const response = await fetch('/api/mission-control/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contentId, status: newStatus }),
      });

      if (response.ok) {
        await fetchContent();
      }
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  const getContentByStatus = (status: ContentStatus) => {
    return content.filter(item => item.status === status);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">🎬 Content Pipeline</h2>
          <p className="text-sm text-gray-400 mt-1">
            Track content from idea to publication
          </p>
        </div>
        <button
          onClick={() => setShowNewContentForm(!showNewContentForm)}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
        >
          + New Content
        </button>
      </div>

      {/* New Content Form */}
      {showNewContentForm && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Create New Content</h3>
          <form onSubmit={createContent} className="space-y-3">
            <input
              type="text"
              placeholder="Content title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select 
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="blog">Blog</option>
            </select>
            <textarea
              placeholder="Script (optional)"
              value={formData.script}
              onChange={(e) => setFormData({ ...formData, script: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewContentForm(false)}
                className="px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Create Content
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {columns.map(column => (
          <div key={column.status} className="bg-[#0a0a0a] rounded-lg p-4">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span>{column.emoji}</span>
                {column.label}
              </h3>
              <span className="text-sm text-gray-500 bg-[#1a1a1a] px-2 py-1 rounded-full">
                {getContentByStatus(column.status).length}
              </span>
            </div>

            {/* Content Items */}
            <div className="space-y-3">
              {getContentByStatus(column.status).map(item => (
                <div
                  key={item.id}
                  className="bg-[#1a1a1a] rounded-lg p-3 shadow-sm border border-gray-800 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  {/* Platform Badge */}
                  {item.platform && (
                    <div className="mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        {item.platform}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h4 className="font-medium text-white mb-2">
                    {item.title}
                  </h4>

                  {/* Due Date */}
                  {item.dueDate && (
                    <div className="text-xs text-gray-500 mb-2">
                      📅 Due: {formatDate(item.dueDate)}
                    </div>
                  )}

                  {/* Script Preview */}
                  {item.script && (
                    <div className="text-xs text-gray-400 mb-2 line-clamp-2">
                      {item.script}
                    </div>
                  )}

                  {/* Quick status change buttons */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-2">
                    {columns.map(col => 
                      col.status !== item.status && (
                        <button
                          key={col.status}
                          onClick={() => updateContentStatus(item.id, col.status)}
                          className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded"
                          title={`Move to ${col.label}`}
                        >
                          {col.emoji}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}

              {getContentByStatus(column.status).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  No content
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
