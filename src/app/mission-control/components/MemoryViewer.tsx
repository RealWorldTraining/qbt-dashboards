'use client';

import { useState, useEffect, useMemo } from 'react';

interface Memory {
  id: number;
  title: string;
  content: string;
  tags: string[] | null;
  pinned: boolean;
  category: string | null;
  conversationRef: string | null;
  date: Date;
  createdAt: Date;
}

type MemoryCategory = 'decision' | 'context' | 'reference' | 'insight' | 'bug';

const categoryConfig: Record<MemoryCategory, { label: string; color: string; border: string }> = {
  decision: { label: 'Decision', color: 'bg-cyan-600/20 text-cyan-400', border: 'border-l-cyan-500' },
  context: { label: 'Context', color: 'bg-purple-600/20 text-purple-400', border: 'border-l-purple-500' },
  reference: { label: 'Reference', color: 'bg-blue-600/20 text-blue-400', border: 'border-l-blue-500' },
  insight: { label: 'Insight', color: 'bg-yellow-600/20 text-yellow-400', border: 'border-l-yellow-500' },
  bug: { label: 'Bug', color: 'bg-red-600/20 text-red-400', border: 'border-l-red-500' },
};

const categories: MemoryCategory[] = ['decision', 'context', 'reference', 'insight', 'bug'];

export default function MemoryViewer() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMemoryForm, setShowNewMemoryForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<MemoryCategory | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    category: '' as string,
    conversationRef: '',
  });

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async (query = '') => {
    try {
      const url = query
        ? `/api/mission-control/memories?q=${encodeURIComponent(query)}`
        : '/api/mission-control/memories';

      const response = await fetch(url);
      const data = await response.json();

      if (!data.mockData) {
        setMemories(data.memories || []);
      }
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemories(searchQuery);
  };

  const createMemory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) return;

    try {
      const response = await fetch('/api/mission-control/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          category: formData.category || null,
          conversationRef: formData.conversationRef || null,
        }),
      });

      if (response.ok) {
        await fetchMemories();
        resetForm();
        setShowNewMemoryForm(false);
      }
    } catch (error) {
      console.error('Error creating memory:', error);
    }
  };

  const updateMemory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingMemory || !formData.title.trim() || !formData.content.trim()) return;

    try {
      const response = await fetch('/api/mission-control/memories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMemory.id,
          title: formData.title,
          content: formData.content,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          category: formData.category || null,
          conversationRef: formData.conversationRef || null,
        }),
      });

      if (response.ok) {
        await fetchMemories();
        resetForm();
        setEditingMemory(null);
      }
    } catch (error) {
      console.error('Error updating memory:', error);
    }
  };

  const togglePin = async (memory: Memory) => {
    try {
      const response = await fetch('/api/mission-control/memories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: memory.id,
          pinned: !memory.pinned,
        }),
      });

      if (response.ok) {
        await fetchMemories();
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const deleteMemory = async (id: number) => {
    try {
      const response = await fetch(`/api/mission-control/memories?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMemories();
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const startEditing = (memory: Memory) => {
    setEditingMemory(memory);
    setFormData({
      title: memory.title,
      content: memory.content,
      tags: memory.tags?.join(', ') || '',
      category: memory.category || '',
      conversationRef: memory.conversationRef || '',
    });
    setShowNewMemoryForm(false);
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', tags: '', category: '', conversationRef: '' });
  };

  const cancelEditing = () => {
    setEditingMemory(null);
    resetForm();
  };

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    memories.forEach(m => m.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [memories]);

  // Filter and sort memories
  const filteredMemories = useMemo(() => {
    let filtered = [...memories];

    if (activeTagFilter) {
      filtered = filtered.filter(m => m.tags?.includes(activeTagFilter));
    }

    if (activeCategoryFilter) {
      filtered = filtered.filter(m => m.category === activeCategoryFilter);
    }

    // Pinned items first
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [memories, activeTagFilter, activeCategoryFilter]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">{part}</mark>
        : part
    );
  };

  const getCategoryBorder = (category: string | null) => {
    if (!category || !(category in categoryConfig)) return 'border-l-gray-700';
    return categoryConfig[category as MemoryCategory].border;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading memories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>🧠</span> Memory Viewer
          </h2>
          <p className="text-gray-400 mt-1">
            Searchable log of key decisions, context, and insights
          </p>
        </div>
        <button
          onClick={() => {
            setShowNewMemoryForm(!showNewMemoryForm);
            setEditingMemory(null);
            resetForm();
          }}
          className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all font-medium shadow-lg hover:shadow-cyan-600/50"
        >
          + New Memory
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
        />
        <button
          type="submit"
          className="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              fetchMemories();
            }}
            className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategoryFilter(activeCategoryFilter === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategoryFilter === cat
                ? categoryConfig[cat].color + ' ring-1 ring-current'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {categoryConfig[cat].label}
          </button>
        ))}
        {activeCategoryFilter && (
          <button
            onClick={() => setActiveCategoryFilter(null)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Tag Chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                activeTagFilter === tag
                  ? 'bg-purple-600/30 text-purple-300 ring-1 ring-purple-500'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              #{tag}
            </button>
          ))}
          {activeTagFilter && (
            <button
              onClick={() => setActiveTagFilter(null)}
              className="px-2.5 py-1 rounded-full text-xs bg-gray-800 text-gray-400 hover:text-white"
            >
              Clear tag
            </button>
          )}
        </div>
      )}

      {/* New/Edit Memory Form */}
      {(showNewMemoryForm || editingMemory) && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl">
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-t-lg -m-6 mb-4" />
          <h3 className="font-semibold text-white text-lg mb-4">
            {editingMemory ? 'Edit Memory' : 'Create New Memory'}
          </h3>
          <form onSubmit={editingMemory ? updateMemory : createMemory} className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
              required
            />
            <textarea
              placeholder="Content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
              >
                <option value="">No category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{categoryConfig[cat].label}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Conversation reference (optional)"
              value={formData.conversationRef}
              onChange={(e) => setFormData({ ...formData, conversationRef: e.target.value })}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewMemoryForm(false);
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
                {editingMemory ? 'Save Changes' : 'Save Memory'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Memories Grid */}
      {filteredMemories.length === 0 ? (
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8 text-center">
          <p className="text-gray-500">
            {searchQuery || activeTagFilter || activeCategoryFilter
              ? 'No memories found matching your filters.'
              : 'No memories yet. Create your first memory!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              className={`bg-[#1a1a1a] rounded-lg border border-gray-800 border-l-4 ${getCategoryBorder(memory.category)} p-4 hover:shadow-lg transition-all group relative ${
                memory.pinned ? 'ring-1 ring-cyan-800/50' : ''
              }`}
            >
              {/* Pin indicator */}
              {memory.pinned && (
                <div className="absolute top-2 right-2 text-cyan-400 text-sm">📌</div>
              )}

              {/* Header */}
              <div className="flex justify-between items-start mb-2 pr-6">
                <h3 className="font-semibold text-white">
                  {highlightText(memory.title, searchQuery)}
                </h3>
              </div>

              {/* Category + Date */}
              <div className="flex items-center gap-2 mb-3">
                {memory.category && categoryConfig[memory.category as MemoryCategory] && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryConfig[memory.category as MemoryCategory].color}`}>
                    {categoryConfig[memory.category as MemoryCategory].label}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {formatDate(memory.createdAt)}
                </span>
              </div>

              {/* Content */}
              <p className="text-gray-300 text-sm mb-3 whitespace-pre-wrap line-clamp-4">
                {highlightText(memory.content, searchQuery)}
              </p>

              {/* Tags */}
              {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {memory.tags.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                      className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                        activeTagFilter === tag
                          ? 'bg-purple-600/30 text-purple-300'
                          : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Conversation Ref */}
              {memory.conversationRef && (
                <div className="text-xs text-gray-500 mb-3">
                  📎 {memory.conversationRef}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-1.5 pt-2 border-t border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => togglePin(memory)}
                  className={`text-xs px-2.5 py-1.5 rounded transition-all ${
                    memory.pinned
                      ? 'bg-cyan-600/20 text-cyan-400'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                  }`}
                  title={memory.pinned ? 'Unpin' : 'Pin to top'}
                >
                  📌
                </button>
                <button
                  onClick={() => startEditing(memory)}
                  className="text-xs px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-all"
                  title="Edit memory"
                >
                  ✏️
                </button>
                {deleteConfirmId === memory.id ? (
                  <>
                    <button
                      onClick={() => deleteMemory(memory.id)}
                      className="text-xs px-2.5 py-1.5 bg-red-600/30 text-red-400 rounded transition-all font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="text-xs px-2.5 py-1.5 bg-gray-800 text-gray-400 rounded transition-all"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(memory.id)}
                    className="text-xs px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-all"
                    title="Delete memory"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
