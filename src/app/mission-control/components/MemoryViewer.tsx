'use client';

import { useState, useEffect, useMemo } from 'react';

interface Memory {
  id: number;
  title: string;
  content: string;
  tags: string[] | null;
  pinned: boolean;
  category: string | null;
  project: string | null;
  createdBy: string | null;
  conversationRef: string | null;
  date: Date;
  createdAt: Date;
}

interface TeamMember {
  id: number;
  name: string;
  avatar: string | null;
  type: string;
}

type MemoryCategory = 'decision' | 'context' | 'reference' | 'insight' | 'bug';

const categoryConfig: Record<MemoryCategory, { label: string; color: string; border: string; icon: string }> = {
  decision: { label: 'Decision', color: 'bg-cyan-600/20 text-cyan-400', border: 'border-l-cyan-500', icon: '⚡' },
  context: { label: 'Context', color: 'bg-purple-600/20 text-purple-400', border: 'border-l-purple-500', icon: '📋' },
  reference: { label: 'Reference', color: 'bg-blue-600/20 text-blue-400', border: 'border-l-blue-500', icon: '🔗' },
  insight: { label: 'Insight', color: 'bg-yellow-600/20 text-yellow-400', border: 'border-l-yellow-500', icon: '💡' },
  bug: { label: 'Bug', color: 'bg-red-600/20 text-red-400', border: 'border-l-red-500', icon: '🐛' },
};

const categories: MemoryCategory[] = ['decision', 'context', 'reference', 'insight', 'bug'];

const projectColors: Record<string, string> = {
  'qbt-dashboards': 'bg-cyan-600/20 text-cyan-400',
  'max-cpc-engine': 'bg-orange-600/20 text-orange-400',
  'qbtraining-site': 'bg-green-600/20 text-green-400',
  'prophet-api': 'bg-purple-600/20 text-purple-400',
};

export default function MemoryViewer() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMemoryForm, setShowNewMemoryForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<MemoryCategory | null>(null);
  const [activeProjectFilter, setActiveProjectFilter] = useState<string | null>(null);
  const [activeAgentFilter, setActiveAgentFilter] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [expandedMemoryId, setExpandedMemoryId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    category: '' as string,
    project: '' as string,
    createdBy: '' as string,
    conversationRef: '',
  });

  useEffect(() => {
    fetchMemories();
    fetchTeamMembers();
  }, []);

  const fetchMemories = async (query = '') => {
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);

      const url = params.toString()
        ? `/api/mission-control/memories?${params}`
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

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/mission-control/team');
      const data = await response.json();
      if (!data.mockData) {
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
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
          project: formData.project || null,
          createdBy: formData.createdBy || null,
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
          project: formData.project || null,
          createdBy: formData.createdBy || null,
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
        body: JSON.stringify({ id: memory.id, pinned: !memory.pinned }),
      });
      if (response.ok) await fetchMemories();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const deleteMemory = async (id: number) => {
    try {
      const response = await fetch(`/api/mission-control/memories?id=${id}`, { method: 'DELETE' });
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
      project: memory.project || '',
      createdBy: memory.createdBy || '',
      conversationRef: memory.conversationRef || '',
    });
    setShowNewMemoryForm(false);
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', tags: '', category: '', project: '', createdBy: '', conversationRef: '' });
  };

  const cancelEditing = () => {
    setEditingMemory(null);
    resetForm();
  };

  // Get avatar for an agent name
  const getAgentAvatar = (name: string | null) => {
    if (!name) return null;
    const member = teamMembers.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (member?.avatar && (member.avatar.startsWith('/') || member.avatar.startsWith('http'))) {
      return member.avatar;
    }
    return null;
  };

  const renderAgentAvatar = (name: string | null, size: string = 'w-7 h-7') => {
    const avatarUrl = getAgentAvatar(name);
    if (avatarUrl) {
      return <img src={avatarUrl} alt={name || ''} className={`${size} rounded-full object-cover`} />;
    }
    return <span className="text-sm">🤖</span>;
  };

  // Collect unique values for filters
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    memories.forEach(m => m.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [memories]);

  const allProjects = useMemo(() => {
    const projectSet = new Set<string>();
    memories.forEach(m => { if (m.project) projectSet.add(m.project); });
    return Array.from(projectSet).sort();
  }, [memories]);

  const allAgents = useMemo(() => {
    const agentSet = new Set<string>();
    memories.forEach(m => { if (m.createdBy) agentSet.add(m.createdBy); });
    return Array.from(agentSet).sort();
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
    if (activeProjectFilter) {
      filtered = filtered.filter(m => m.project === activeProjectFilter);
    }
    if (activeAgentFilter) {
      filtered = filtered.filter(m => m.createdBy === activeAgentFilter);
    }

    // Pinned first, then by date
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [memories, activeTagFilter, activeCategoryFilter, activeProjectFilter, activeAgentFilter]);

  // Group memories by date for journal view
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Memory[]> = {};
    filteredMemories.forEach(memory => {
      const dateKey = new Date(memory.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(memory);
    });
    return groups;
  }, [filteredMemories]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getCategoryBorder = (category: string | null) => {
    if (!category || !(category in categoryConfig)) return 'border-l-gray-700';
    return categoryConfig[category as MemoryCategory].border;
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

  const activeFilterCount = [activeTagFilter, activeCategoryFilter, activeProjectFilter, activeAgentFilter].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading memories...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Left Sidebar — Filters */}
      <div className="w-64 flex-shrink-0 space-y-5">
        {/* Search */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500 text-sm pr-16"
            />
            <div className="absolute right-1 top-1 flex gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); fetchMemories(); }}
                  className="px-2 py-1.5 text-gray-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700"
              >
                Go
              </button>
            </div>
          </div>
        </form>

        {/* Agent Filter — Avatar Strip */}
        {allAgents.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Agent</div>
            <div className="flex flex-wrap gap-2">
              {allAgents.map(agent => {
                const avatarUrl = getAgentAvatar(agent);
                const isActive = activeAgentFilter === agent;
                return (
                  <button
                    key={agent}
                    onClick={() => setActiveAgentFilter(isActive ? null : agent)}
                    className={`relative group transition-all ${isActive ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                    title={agent}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={agent}
                        className={`w-10 h-10 rounded-full object-cover border-2 transition-all ${
                          isActive ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'border-gray-700 hover:border-gray-500'
                        }`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border-2 text-sm ${
                        isActive ? 'border-cyan-500' : 'border-gray-700'
                      }`}>
                        🤖
                      </div>
                    )}
                    <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap ${
                      isActive ? 'text-cyan-400' : 'text-gray-500'
                    }`}>
                      {agent.split(' ')[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Filter */}
        {allProjects.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Project</div>
            <div className="space-y-1">
              {allProjects.map(project => {
                const isActive = activeProjectFilter === project;
                const count = memories.filter(m => m.project === project).length;
                const colorClass = projectColors[project] || 'bg-gray-600/20 text-gray-400';
                return (
                  <button
                    key={project}
                    onClick={() => setActiveProjectFilter(isActive ? null : project)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? colorClass + ' ring-1 ring-current'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                    }`}
                  >
                    <span className="truncate">{project}</span>
                    <span className="text-xs opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Category</div>
          <div className="space-y-1">
            {categories.map(cat => {
              const count = memories.filter(m => m.category === cat).length;
              const isActive = activeCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(isActive ? null : cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? categoryConfig[cat].color + ' ring-1 ring-current'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{categoryConfig[cat].icon}</span>
                    <span>{categoryConfig[cat].label}</span>
                  </span>
                  <span className="text-xs opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-all ${
                    activeTagFilter === tag
                      ? 'bg-purple-600/30 text-purple-300 ring-1 ring-purple-500'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clear All Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => {
              setActiveTagFilter(null);
              setActiveCategoryFilter(null);
              setActiveProjectFilter(null);
              setActiveAgentFilter(null);
            }}
            className="w-full px-3 py-2 text-xs bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            Clear all filters ({activeFilterCount})
          </button>
        )}

        {/* Stats */}
        <div className="border-t border-gray-800 pt-4">
          <div className="text-xs text-gray-600 space-y-1">
            <div>{memories.length} total memories</div>
            <div>{memories.filter(m => m.pinned).length} pinned</div>
            {activeFilterCount > 0 && (
              <div className="text-cyan-500">{filteredMemories.length} matching</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content — Journal View */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <span>🧠</span> Memory Journal
            </h2>
            <p className="text-gray-400 mt-1">
              Decisions, context, and insights across all sessions
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

        {/* New/Edit Memory Form */}
        {(showNewMemoryForm || editingMemory) && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl mb-6">
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
              <div className="grid grid-cols-3 gap-4">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                >
                  <option value="">Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{categoryConfig[cat].label}</option>
                  ))}
                </select>
                <select
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                >
                  <option value="">Project</option>
                  <option value="qbt-dashboards">qbt-dashboards</option>
                  <option value="max-cpc-engine">max-cpc-engine</option>
                  <option value="qbtraining-site">qbtraining-site</option>
                  <option value="prophet-api">prophet-api</option>
                </select>
                <select
                  value={formData.createdBy}
                  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                >
                  <option value="">Agent / Author</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
                />
                <input
                  type="text"
                  placeholder="Session reference (optional)"
                  value={formData.conversationRef}
                  onChange={(e) => setFormData({ ...formData, conversationRef: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowNewMemoryForm(false); cancelEditing(); }}
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

        {/* Journal Entries — Grouped by Date */}
        {filteredMemories.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-12 text-center">
            <div className="text-5xl mb-4">🧠</div>
            <p className="text-gray-400 text-lg">
              {searchQuery || activeTagFilter || activeCategoryFilter || activeProjectFilter || activeAgentFilter
                ? 'No memories found matching your filters.'
                : 'No memories yet. Create your first memory!'}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Memories are automatically logged by AI agents as they work across your projects.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByDate).map(([dateLabel, dayMemories]) => (
              <div key={dateLabel}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-sm font-semibold text-gray-300">{dateLabel}</div>
                  <div className="flex-1 h-px bg-gray-800" />
                  <div className="text-xs text-gray-600">{dayMemories.length} entries</div>
                </div>

                {/* Timeline */}
                <div className="relative pl-8">
                  {/* Vertical timeline line */}
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-800" />

                  <div className="space-y-4">
                    {dayMemories.map((memory) => {
                      const isExpanded = expandedMemoryId === memory.id;
                      const catConfig = memory.category && categoryConfig[memory.category as MemoryCategory];

                      return (
                        <div key={memory.id} className="relative group">
                          {/* Timeline dot */}
                          <div className={`absolute -left-5 top-3 w-3 h-3 rounded-full border-2 bg-[#0d0d0d] ${
                            memory.pinned ? 'border-cyan-400' :
                            catConfig ? catConfig.border.replace('border-l-', 'border-') : 'border-gray-600'
                          }`} />

                          {/* Memory Card */}
                          <div
                            className={`bg-[#1a1a1a] rounded-lg border border-gray-800 border-l-4 ${getCategoryBorder(memory.category)} overflow-hidden transition-all hover:border-gray-700 ${
                              memory.pinned ? 'ring-1 ring-cyan-800/30' : ''
                            }`}
                          >
                            {/* Card Header */}
                            <div
                              className="px-4 py-3 cursor-pointer"
                              onClick={() => setExpandedMemoryId(isExpanded ? null : memory.id)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Agent Avatar */}
                                <div className="flex-shrink-0 mt-0.5">
                                  {renderAgentAvatar(memory.createdBy)}
                                </div>

                                {/* Title + Meta */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-white text-sm">
                                      {highlightText(memory.title, searchQuery)}
                                    </h3>
                                    {memory.pinned && <span className="text-cyan-400 text-xs">📌</span>}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-gray-500">{formatTime(memory.createdAt)}</span>
                                    {memory.createdBy && (
                                      <span className="text-xs text-gray-400">{memory.createdBy}</span>
                                    )}
                                    {catConfig && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${catConfig.color}`}>
                                        {catConfig.icon} {catConfig.label}
                                      </span>
                                    )}
                                    {memory.project && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                        projectColors[memory.project] || 'bg-gray-600/20 text-gray-400'
                                      }`}>
                                        {memory.project}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Expand indicator */}
                                <div className={`text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                                  ▾
                                </div>
                              </div>

                              {/* Preview when collapsed */}
                              {!isExpanded && (
                                <p className="text-gray-400 text-xs mt-2 ml-10 line-clamp-2">
                                  {highlightText(memory.content, searchQuery)}
                                </p>
                              )}
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-800/50">
                                <p className="text-gray-300 text-sm whitespace-pre-wrap mt-3 ml-10">
                                  {highlightText(memory.content, searchQuery)}
                                </p>

                                {/* Tags */}
                                {memory.tags && memory.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3 ml-10">
                                    {memory.tags.map((tag, idx) => (
                                      <button
                                        key={idx}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveTagFilter(activeTagFilter === tag ? null : tag);
                                        }}
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
                                  <div className="text-xs text-gray-500 mt-2 ml-10">
                                    📎 {memory.conversationRef}
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-1.5 mt-3 ml-10">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); togglePin(memory); }}
                                    className={`text-xs px-2.5 py-1.5 rounded transition-all ${
                                      memory.pinned
                                        ? 'bg-cyan-600/20 text-cyan-400'
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                                    }`}
                                  >
                                    📌 {memory.pinned ? 'Unpin' : 'Pin'}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startEditing(memory); }}
                                    className="text-xs px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-all"
                                  >
                                    ✏️ Edit
                                  </button>
                                  {deleteConfirmId === memory.id ? (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); deleteMemory(memory.id); }}
                                        className="text-xs px-2.5 py-1.5 bg-red-600/30 text-red-400 rounded transition-all font-medium"
                                      >
                                        Confirm Delete
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                        className="text-xs px-2.5 py-1.5 bg-gray-800 text-gray-400 rounded transition-all"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(memory.id); }}
                                      className="text-xs px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-all"
                                    >
                                      🗑️ Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
