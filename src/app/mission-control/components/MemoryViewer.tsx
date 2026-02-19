'use client';

import { useState, useEffect } from 'react';

interface Memory {
  id: number;
  title: string;
  content: string;
  tags: string[] | null;
  conversationRef: string | null;
  date: Date;
  createdAt: Date;
}

export default function MemoryViewer() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMemoryForm, setShowNewMemoryForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
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
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        }),
      });

      if (response.ok) {
        await fetchMemories();
        setFormData({ title: '', content: '', tags: '', conversationRef: '' });
        setShowNewMemoryForm(false);
      }
    } catch (error) {
      console.error('Error creating memory:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <h2 className="text-2xl font-bold text-white">🧠 Memory Viewer</h2>
          <p className="text-sm text-gray-400 mt-1">
            Searchable log of key decisions and context
          </p>
        </div>
        <button
          onClick={() => setShowNewMemoryForm(!showNewMemoryForm)}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
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
          className="flex-1 px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
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
            className="px-4 py-2 bg-gray-200 text-gray-300 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* New Memory Form */}
      {showNewMemoryForm && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Create New Memory</h3>
          <form onSubmit={createMemory} className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Conversation reference (optional)"
              value={formData.conversationRef}
              onChange={(e) => setFormData({ ...formData, conversationRef: e.target.value })}
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewMemoryForm(false)}
                className="px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Save Memory
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Memories List */}
      <div className="space-y-3">
        {memories.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8 text-center">
            <p className="text-gray-500">
              {searchQuery ? 'No memories found matching your search.' : 'No memories yet. Create your first memory!'}
            </p>
          </div>
        ) : (
          memories.map((memory) => (
            <div
              key={memory.id}
              className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-white">
                  {memory.title}
                </h3>
                <span className="text-xs text-gray-500">
                  {formatDate(memory.createdAt)}
                </span>
              </div>
              
              <p className="text-gray-300 mb-3 whitespace-pre-wrap">
                {memory.content}
              </p>
              
              {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {memory.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {memory.conversationRef && (
                <div className="text-xs text-gray-500 mt-2">
                  📎 Ref: {memory.conversationRef}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
