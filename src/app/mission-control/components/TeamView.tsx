'use client';

import { useState, useEffect } from 'react';

type MemberType = 'human' | 'ai_main' | 'ai_desktop' | 'ai_subagent';
type MemberStatus = 'active' | 'idle' | 'offline';

interface TeamMember {
  id: number;
  name: string;
  role: string | null;
  type: MemberType;
  status: MemberStatus;
  avatar: string | null;
  description: string | null;
  responsibilities: string[] | null;
  currentWork: string | null;
  lastActive: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  id: number;
  title: string;
  status: string;
  assignedTo: string | null;
}

const typeConfig: Record<MemberType, { label: string; border: string; badge: string }> = {
  human: { label: 'Human', border: 'border-t-cyan-500', badge: 'bg-cyan-600/20 text-cyan-400' },
  ai_main: { label: 'AI Main', border: 'border-t-purple-500', badge: 'bg-purple-600/20 text-purple-400' },
  ai_desktop: { label: 'AI Desktop', border: 'border-t-green-500', badge: 'bg-green-600/20 text-green-400' },
  ai_subagent: { label: 'AI Subagent', border: 'border-t-gray-500', badge: 'bg-gray-700 text-gray-300' },
};

const statusConfig: Record<MemberStatus, { label: string; dot: string; ring: string }> = {
  active: { label: 'Active', dot: 'bg-green-400 animate-pulse', ring: 'ring-green-400/30' },
  idle: { label: 'Idle', dot: 'bg-yellow-400', ring: 'ring-yellow-400/30' },
  offline: { label: 'Offline', dot: 'bg-gray-500', ring: 'ring-gray-500/30' },
};

export default function TeamView() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    type: 'human' as MemberType,
    status: 'active' as MemberStatus,
    avatar: '',
    description: '',
    responsibilities: '',
    currentWork: '',
  });

  useEffect(() => {
    fetchMembers();
    fetchTasks();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/mission-control/team');
      const data = await response.json();

      if (!data.mockData) {
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/mission-control/tasks');
      const data = await response.json();
      if (!data.mockData) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    try {
      const response = await fetch('/api/mission-control/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role || null,
          type: formData.type,
          status: formData.status,
          avatar: formData.avatar || null,
          description: formData.description || null,
          responsibilities: formData.responsibilities
            ? formData.responsibilities.split(',').map(r => r.trim()).filter(Boolean)
            : [],
          currentWork: formData.currentWork || null,
        }),
      });

      if (response.ok) {
        await fetchMembers();
        resetForm();
        setShowNewMemberForm(false);
      }
    } catch (error) {
      console.error('Error creating team member:', error);
    }
  };

  const updateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingMember || !formData.name.trim()) return;

    try {
      const response = await fetch('/api/mission-control/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMember.id,
          name: formData.name,
          role: formData.role || null,
          type: formData.type,
          status: formData.status,
          avatar: formData.avatar || null,
          description: formData.description || null,
          responsibilities: formData.responsibilities
            ? formData.responsibilities.split(',').map(r => r.trim()).filter(Boolean)
            : [],
          currentWork: formData.currentWork || null,
        }),
      });

      if (response.ok) {
        await fetchMembers();
        resetForm();
        setEditingMember(null);
      }
    } catch (error) {
      console.error('Error updating team member:', error);
    }
  };

  const updateStatus = async (memberId: number, newStatus: MemberStatus) => {
    try {
      const response = await fetch('/api/mission-control/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, status: newStatus, lastActive: new Date() }),
      });

      if (response.ok) {
        await fetchMembers();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteMember = async (memberId: number) => {
    if (!confirm('Remove this team member?')) return;

    try {
      const response = await fetch(`/api/mission-control/team?id=${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMembers();
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
    }
  };

  const startEditing = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role || '',
      type: member.type,
      status: member.status,
      avatar: member.avatar || '',
      description: member.description || '',
      responsibilities: member.responsibilities?.join(', ') || '',
      currentWork: member.currentWork || '',
    });
    setShowNewMemberForm(false);
  };

  const resetForm = () => {
    setFormData({
      name: '', role: '', type: 'human', status: 'active',
      avatar: '', description: '', responsibilities: '', currentWork: '',
    });
  };

  const getLinkedTasks = (memberName: string) => {
    const lowerName = memberName.toLowerCase();
    return tasks.filter(t =>
      t.assignedTo?.toLowerCase() === lowerName && t.status !== 'done'
    );
  };

  const getRelativeTime = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();

    if (diffMs < 60000) return 'just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>👥</span> Team
          </h2>
          <p className="text-gray-400 mt-1">
            Your human + AI workforce
          </p>
        </div>
        <button
          onClick={() => {
            setShowNewMemberForm(!showNewMemberForm);
            setEditingMember(null);
            resetForm();
          }}
          className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all font-medium shadow-lg hover:shadow-cyan-600/50"
        >
          + Add Member
        </button>
      </div>

      {/* New/Edit Member Form */}
      {(showNewMemberForm || editingMember) && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl">
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-t-lg -m-6 mb-4" />
          <h3 className="font-semibold text-white text-lg mb-4">
            {editingMember ? 'Edit Team Member' : 'Add Team Member'}
          </h3>
          <form onSubmit={editingMember ? updateMember : createMember} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
                required
              />
              <input
                type="text"
                placeholder="Role (e.g., Lead Engineer)"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as MemberType })}
                className="px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
              >
                <option value="human">Human</option>
                <option value="ai_main">AI Main</option>
                <option value="ai_desktop">AI Desktop</option>
                <option value="ai_subagent">AI Subagent</option>
              </select>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                className="px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
              >
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="offline">Offline</option>
              </select>
              <input
                type="text"
                placeholder="Avatar emoji or image path (e.g., 👨‍💼 or /avatars/name.png)"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
              />
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Responsibilities (comma-separated)"
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Current work"
              value={formData.currentWork}
              onChange={(e) => setFormData({ ...formData, currentWork: e.target.value })}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewMemberForm(false);
                  setEditingMember(null);
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
                {editingMember ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Grid */}
      {members.length === 0 ? (
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8 text-center">
          <p className="text-gray-500">No team members yet. Add your first team member!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const tConfig = typeConfig[member.type] || typeConfig.human;
            const sConfig = statusConfig[member.status] || statusConfig.offline;
            const linkedTasks = getLinkedTasks(member.name);

            return (
              <div
                key={member.id}
                className={`bg-[#1a1a1a] rounded-lg border border-gray-800 border-t-4 ${tConfig.border} overflow-hidden hover:shadow-lg transition-all group ${
                  member.status === 'offline' ? 'opacity-60' : ''
                }`}
              >
                <div className="p-5">
                  {/* Avatar + Name + Status */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`relative`}>
                      {member.avatar && (member.avatar.startsWith('/') || member.avatar.startsWith('http')) ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="text-4xl">
                          {member.avatar || (member.type === 'human' ? '👤' : '🤖')}
                        </div>
                      )}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${sConfig.dot} ring-2 ${sConfig.ring} ring-offset-1 ring-offset-[#1a1a1a]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg truncate">{member.name}</h3>
                      {member.role && (
                        <p className="text-sm text-gray-400">{member.role}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tConfig.badge}`}>
                          {tConfig.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {sConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {member.description && (
                    <p className="text-sm text-gray-400 mb-3">{member.description}</p>
                  )}

                  {/* Current Work */}
                  {member.currentWork && (
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 mb-3">
                      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Currently working on</div>
                      <p className="text-sm text-cyan-400">{member.currentWork}</p>
                    </div>
                  )}

                  {/* Responsibilities */}
                  {member.responsibilities && member.responsibilities.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Responsibilities</div>
                      <div className="flex flex-wrap gap-1.5">
                        {member.responsibilities.map((resp, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 rounded-full">
                            {resp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Tasks */}
                  {linkedTasks.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Active Tasks</div>
                      <div className="space-y-1">
                        {linkedTasks.slice(0, 3).map(task => (
                          <div key={task.id} className="text-xs text-gray-300 bg-[#0a0a0a] px-2 py-1 rounded flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              task.status === 'in_progress' ? 'bg-blue-400' :
                              task.status === 'blocked' ? 'bg-yellow-400' : 'bg-gray-400'
                            }`} />
                            <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {linkedTasks.length > 3 && (
                          <div className="text-xs text-gray-500">+{linkedTasks.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Last Active */}
                  {member.lastActive && (
                    <div className="text-xs text-gray-500">
                      Last active: {getRelativeTime(member.lastActive)}
                    </div>
                  )}

                  {/* Quick Status + Actions */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(['active', 'idle', 'offline'] as MemberStatus[]).map(s =>
                      s !== member.status && (
                        <button
                          key={s}
                          onClick={() => updateStatus(member.id, s)}
                          className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-all"
                        >
                          {statusConfig[s].label}
                        </button>
                      )
                    )}
                    <div className="flex-1" />
                    <button
                      onClick={() => startEditing(member)}
                      className="text-xs px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-all"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteMember(member.id)}
                      className="text-xs px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
