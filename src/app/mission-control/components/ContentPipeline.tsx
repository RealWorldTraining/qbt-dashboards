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

const platformConfig: Record<string, { color: string; icon: string }> = {
  youtube: { color: 'bg-red-600/20 text-red-400', icon: '▶️' },
  twitter: { color: 'bg-sky-600/20 text-sky-400', icon: '🐦' },
  linkedin: { color: 'bg-blue-600/20 text-blue-400', icon: '💼' },
  blog: { color: 'bg-green-600/20 text-green-400', icon: '📝' },
};

export default function ContentPipeline() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [showNewContentForm, setShowNewContentForm] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
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
        resetForm();
        setShowNewContentForm(false);
      }
    } catch (error) {
      console.error('Error creating content:', error);
    }
  };

  const updateContent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingContent || !formData.title.trim()) return;

    try {
      const response = await fetch('/api/mission-control/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingContent.id,
          title: formData.title,
          platform: formData.platform,
          script: formData.script || null,
          notes: formData.notes || null,
          dueDate: formData.dueDate || null,
        }),
      });

      if (response.ok) {
        await fetchContent();
        resetForm();
        setEditingContent(null);
      }
    } catch (error) {
      console.error('Error updating content:', error);
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

  const deleteContent = async (contentId: number) => {
    if (!confirm('Delete this content item?')) return;

    try {
      const response = await fetch(`/api/mission-control/content?id=${contentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchContent();
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const startEditing = (item: ContentItem) => {
    setEditingContent(item);
    setFormData({
      title: item.title,
      platform: item.platform || 'youtube',
      script: item.script || '',
      notes: item.notes || '',
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
    });
    setShowNewContentForm(false);
  };

  const resetForm = () => {
    setFormData({ title: '', platform: 'youtube', script: '', notes: '', dueDate: '' });
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

  const isOverdue = (item: ContentItem) => {
    if (!item.dueDate || item.status === 'published') return false;
    return new Date(item.dueDate) < new Date();
  };

  const getPlatformBadge = (platform: string | null) => {
    if (!platform) return null;
    const config = platformConfig[platform] || { color: 'bg-gray-800 text-gray-400', icon: '📄' };
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.color} font-medium`}>
        {config.icon} {platform}
      </span>
    );
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
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>🎬</span> Content Pipeline
          </h2>
          <p className="text-gray-400 mt-1">
            Track content from idea to publication
          </p>
        </div>
        <button
          onClick={() => {
            setShowNewContentForm(!showNewContentForm);
            setEditingContent(null);
            resetForm();
          }}
          className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all font-medium shadow-lg hover:shadow-cyan-600/50"
        >
          + New Content
        </button>
      </div>

      {/* New/Edit Content Form */}
      {(showNewContentForm || editingContent) && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl">
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-t-lg -m-6 mb-4" />
          <h3 className="font-semibold text-white text-lg mb-4">
            {editingContent ? 'Edit Content' : 'Create New Content'}
          </h3>
          <form onSubmit={editingContent ? updateContent : createContent} className="space-y-4">
            <input
              type="text"
              placeholder="Content title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
              >
                <option value="youtube">▶️ YouTube</option>
                <option value="twitter">🐦 Twitter</option>
                <option value="linkedin">💼 LinkedIn</option>
                <option value="blog">📝 Blog</option>
              </select>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
              />
            </div>
            <textarea
              placeholder="Script (optional)"
              value={formData.script}
              onChange={(e) => setFormData({ ...formData, script: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewContentForm(false);
                  setEditingContent(null);
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
                {editingContent ? 'Save Changes' : 'Create Content'}
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
                  className={`bg-[#1a1a1a] rounded-lg p-3 shadow-sm border hover:shadow-md transition-all group ${
                    isOverdue(item) ? 'border-red-600/50' : 'border-gray-800'
                  }`}
                >
                  {/* Thumbnail */}
                  {item.thumbnailUrl && (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  )}

                  {/* Overdue badge */}
                  {isOverdue(item) && (
                    <div className="text-xs px-2 py-0.5 bg-red-600/20 text-red-400 rounded-full inline-block mb-2 font-medium">
                      OVERDUE
                    </div>
                  )}

                  {/* Platform Badge */}
                  {item.platform && (
                    <div className="mb-2">
                      {getPlatformBadge(item.platform)}
                    </div>
                  )}

                  {/* Title */}
                  <h4 className="font-medium text-white mb-2">
                    {item.title}
                  </h4>

                  {/* Due Date */}
                  {item.dueDate && (
                    <div className={`text-xs mb-2 ${isOverdue(item) ? 'text-red-400' : 'text-gray-500'}`}>
                      📅 Due: {formatDate(item.dueDate)}
                    </div>
                  )}

                  {/* Script Preview */}
                  {item.script && (
                    <div className="text-xs text-gray-400 mb-2 line-clamp-2">
                      {item.script}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-2 pt-2 border-t border-gray-800">
                    <button
                      onClick={() => startEditing(item)}
                      className="text-xs px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-all"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteContent(item.id)}
                      className="text-xs px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-all"
                      title="Delete"
                    >
                      🗑️
                    </button>
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
