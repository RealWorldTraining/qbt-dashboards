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
}

interface DeskPosition {
  x: number;
  y: number;
}

const deskPositions: DeskPosition[] = [
  { x: 10, y: 20 },
  { x: 40, y: 20 },
  { x: 70, y: 20 },
  { x: 10, y: 55 },
  { x: 40, y: 55 },
  { x: 70, y: 55 },
];

export default function OfficeView() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchMembers();
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

  const getScreenColor = (status: MemberStatus) => {
    switch (status) {
      case 'active': return 'bg-cyan-500/20 border-cyan-500/40';
      case 'idle': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'offline': return 'bg-gray-800 border-gray-700';
    }
  };

  const getScreenGlow = (status: MemberStatus) => {
    switch (status) {
      case 'active': return 'shadow-[0_0_20px_rgba(6,182,212,0.3)]';
      case 'idle': return 'shadow-[0_0_10px_rgba(234,179,8,0.1)]';
      case 'offline': return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading office...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <span>🏢</span> The Office
        </h2>
        <p className="text-gray-400 mt-1">
          Your virtual headquarters — click an agent to see details
        </p>
      </div>

      {/* Office Floor Plan */}
      <div className="relative bg-[#0d0d0d] border border-gray-800 rounded-xl overflow-hidden" style={{ minHeight: '600px' }}>
        {/* Floor pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Office decorations */}
        <div className="absolute top-4 left-4 text-2xl opacity-60" title="Plant">🪴</div>
        <div className="absolute top-4 right-4 text-2xl opacity-60" title="Coffee machine">☕</div>
        <div className="absolute bottom-4 right-4 text-2xl opacity-60" title="Water cooler">🚰</div>

        {/* Whiteboard */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-gray-700 rounded-lg px-6 py-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider text-center">Mission Control HQ</div>
          <div className="text-xs text-gray-600 text-center mt-0.5">
            {members.filter(m => m.status === 'active').length} active / {members.length} total
          </div>
        </div>

        {/* Agent Desks */}
        {members.map((member, index) => {
          const pos = deskPositions[index % deskPositions.length];
          const isActive = member.status === 'active';
          const isIdle = member.status === 'idle';
          const isOffline = member.status === 'offline';

          return (
            <div
              key={member.id}
              className={`absolute cursor-pointer transition-all duration-300 hover:scale-105 ${
                isOffline ? 'grayscale opacity-50' : ''
              }`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: '22%' }}
              onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
            >
              {/* Desk + Monitor */}
              <div className="flex flex-col items-center">
                {/* Monitor Screen */}
                <div className={`w-full h-20 rounded-t-lg border-2 ${getScreenColor(member.status)} ${getScreenGlow(member.status)} relative overflow-hidden transition-all`}>
                  {/* Screen content */}
                  <div className="absolute inset-2 flex flex-col justify-center items-center">
                    {isActive && member.currentWork ? (
                      <div className="text-[10px] text-cyan-300/80 text-center leading-tight px-1 line-clamp-2">
                        {member.currentWork}
                      </div>
                    ) : isActive ? (
                      <div className="text-[10px] text-cyan-300/60 text-center">Working...</div>
                    ) : isIdle ? (
                      <div className="text-lg office-zzz">💤</div>
                    ) : (
                      <div className="text-[10px] text-gray-600 text-center">OFF</div>
                    )}
                  </div>

                  {/* Typing indicator for active */}
                  {isActive && (
                    <div className="absolute bottom-1.5 right-2 flex gap-0.5">
                      <span className="w-1 h-1 bg-cyan-400 rounded-full office-typing-dot" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-cyan-400 rounded-full office-typing-dot" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-cyan-400 rounded-full office-typing-dot" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}

                  {/* Screen glow effect */}
                  {isActive && (
                    <div className="absolute inset-0 office-screen-glow" />
                  )}
                </div>

                {/* Monitor Stand */}
                <div className="w-4 h-3 bg-gray-700 mx-auto" />
                <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto" />

                {/* Desk surface */}
                <div className="w-full h-8 bg-[#1a1a1a] border border-gray-800 rounded-lg mt-0.5 flex items-center justify-center relative">
                  {/* Keyboard */}
                  <div className="w-12 h-3 bg-gray-800 rounded-sm border border-gray-700" />
                </div>

                {/* Chair + Avatar */}
                <div className="mt-1 flex flex-col items-center">
                  <div className="mb-0.5">
                    {member.avatar && (member.avatar.startsWith('/') || member.avatar.startsWith('http')) ? (
                      <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover mx-auto" />
                    ) : (
                      <div className="text-2xl">{member.avatar || (member.type === 'human' ? '👤' : '🤖')}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-300 font-medium text-center truncate w-full">
                    {member.name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-green-400 animate-pulse' :
                      isIdle ? 'bg-yellow-400' : 'bg-gray-500'
                    }`} />
                    <span className="text-[10px] text-gray-500">{member.status}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty office message */}
        {members.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">🏢</div>
              <p className="text-gray-500">The office is empty. Add team members to see them here!</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Member Detail Panel */}
      {selectedMember && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 animate-preview-in">
          <div className="flex items-start gap-4">
            {selectedMember.avatar && (selectedMember.avatar.startsWith('/') || selectedMember.avatar.startsWith('http')) ? (
              <img src={selectedMember.avatar} alt={selectedMember.name} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="text-5xl">
                {selectedMember.avatar || (selectedMember.type === 'human' ? '👤' : '🤖')}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">{selectedMember.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedMember.status === 'active' ? 'bg-green-600/20 text-green-400' :
                  selectedMember.status === 'idle' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {selectedMember.status}
                </span>
              </div>
              {selectedMember.role && (
                <p className="text-gray-400 mt-0.5">{selectedMember.role}</p>
              )}
              {selectedMember.description && (
                <p className="text-sm text-gray-400 mt-2">{selectedMember.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                {selectedMember.currentWork && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Work</div>
                    <p className="text-sm text-cyan-400">{selectedMember.currentWork}</p>
                  </div>
                )}
                {selectedMember.responsibilities && selectedMember.responsibilities.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Responsibilities</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedMember.responsibilities.map((r, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 rounded-full">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedMember(null)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
