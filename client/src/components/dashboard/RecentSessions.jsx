import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Calendar, FileCode, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, FolderOpen } from 'lucide-react';

const INITIAL_MOCK_SESSIONS = [
  {
    id: 'cs-algo-9821',
    title: 'Senior Frontend Architecture Round',
    candidate: 'Sarah Jenkins',
    date: 'Today, 2:30 PM',
    language: 'JavaScript',
    languageBadge: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    duration: '52 mins',
    status: 'Completed',
    statusBadge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  },
  {
    id: 'cs-tree-4412',
    title: 'Binary Tree Inversion & BFS Pair Programming',
    candidate: 'David Chen',
    date: 'Yesterday, 11:00 AM',
    language: 'Python',
    languageBadge: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
    duration: '45 mins',
    status: 'Completed',
    statusBadge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  },
  {
    id: 'cs-sys-1092',
    title: 'Distributed Rate Limiter Whiteboard Review',
    candidate: 'Alex Rivera',
    date: 'Oct 18, 2026',
    language: 'TypeScript',
    languageBadge: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
    duration: '60 mins',
    status: 'Archived',
    statusBadge: 'bg-white/[0.06] text-text-muted border-white/[0.1]',
  },
];

export default function RecentSessions() {
  const [sessions, setSessions] = useState(INITIAL_MOCK_SESSIONS);
  const navigate = useNavigate();

  const toggleEmptyState = () => {
    setSessions((prev) => (prev.length > 0 ? [] : INITIAL_MOCK_SESSIONS));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text">Recent Interview Sessions</h3>
            <span className="text-[10px] font-medium text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
              Mock Data
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Simulated demonstration history. Real session logs will sync with MongoDB in later steps.
          </p>
        </div>

        {/* Empty state preview toggle */}
        <button
          type="button"
          onClick={toggleEmptyState}
          className="self-start sm:self-auto text-xs font-medium text-text-muted hover:text-text border border-white/[0.08] hover:border-white/[0.15] bg-surface-light/40 hover:bg-surface-light px-3 py-1.5 rounded-lg transition"
        >
          {sessions.length > 0 ? 'Preview Empty State' : 'Restore Demo Sessions'}
        </button>
      </div>

      {/* Content */}
      {sessions.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-surface/30 p-10 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-text-muted">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-text">No Recent Sessions Recorded</h4>
          <p className="text-xs text-text-muted max-w-sm leading-relaxed">
            When you create rooms and conduct coding interviews, your saved sessions, code snapshots, and notes will appear here.
          </p>
          <button
            type="button"
            onClick={toggleEmptyState}
            className="mt-2 text-xs font-medium text-primary-light hover:text-accent underline underline-offset-4"
          >
            Click here to restore sample session data
          </button>
        </div>
      ) : (
        /* Sessions Table / Cards */
        <div className="rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-xl overflow-hidden shadow-lg">
          <div className="divide-y divide-white/[0.06]">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-white/[0.02]"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm text-text">{session.title}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${session.statusBadge}`}>
                      {session.status}
                    </span>
                    <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${session.languageBadge}`}>
                      {session.language}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      <FileCode className="h-3.5 w-3.5 text-text-muted/60" />
                      {session.id}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-text-muted/60" />
                      {session.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-text-muted/60" />
                      {session.duration}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 sm:self-center">
                  <button
                    type="button"
                    onClick={() => navigate(`/room/${session.id}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1.5 rounded-lg transition"
                  >
                    <span>Re-open Room</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
