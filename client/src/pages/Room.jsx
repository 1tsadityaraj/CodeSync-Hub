import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Code2,
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Users,
  Shield,
  FileCode,
  AlertCircle,
  Sparkles,
  Terminal,
  LogOut,
  StopCircle,
  RotateCw,
} from 'lucide-react';
import { roomApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const LANGUAGE_LABELS = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  go: 'Go',
  rust: 'Rust',
};

export default function Room() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  /**
   * Load room details and establish membership
   */
  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError('');

    try {
      // 1. Fetch room details
      let roomData = await roomApi.getRoom(roomId);
      let currentRoom = roomData.room;

      // 2. If room is active and current user is not in participants, join it
      const isParticipant = currentRoom.participants?.some(
        (p) => p.id === user?._id || p.id === user?.id || p.email === user?.email
      );

      if (!isParticipant && currentRoom.status === 'active') {
        const joinRes = await roomApi.joinRoom(roomId);
        currentRoom = joinRes.room;
      }

      setRoom(currentRoom);
    } catch (err) {
      setError(err.message || 'Unable to access interview room');
    } finally {
      setLoading(false);
    }
  }, [roomId, user]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  const copyToClipboard = async (text, type) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // Ignore
    }
  };

  const handleEndRoom = async () => {
    if (!window.confirm('Are you sure you want to end this interview room? No new participants will be able to join.')) {
      return;
    }

    setIsEnding(true);
    try {
      const data = await roomApi.endRoom(roomId);
      setRoom(data.room);
    } catch (err) {
      alert(err.message || 'Failed to end interview room');
    } finally {
      setIsEnding(false);
    }
  };

  const inviteUrl = window.location.href;
  const isCreator = room?.isOwner || room?.creator?.id === user?._id || room?.creator?.id === user?.id;
  const isActive = room?.status === 'active';

  // ── Loading Screen ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-6 space-y-4">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25">
          <Code2 className="h-7 w-7 text-primary animate-pulse" />
        </div>
        <div className="flex items-center gap-2.5 text-xs text-text-muted font-medium">
          <svg className="h-4 w-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>Connecting to Room Lobby...</span>
        </div>
      </div>
    );
  }

  // ── Error Screen (404 / Inaccessible) ────────────────────────
  if (error || !room) {
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/25 bg-surface/75 backdrop-blur-xl p-8 text-center space-y-4 shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-text">Room Inaccessible</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            {error || 'This interview room does not exist, has expired, or is no longer available.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={loadRoom}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs font-medium text-text hover:bg-white/[0.04] transition"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Try Again
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-primary-dark"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Workspace Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Room Lobby View ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      {/* ── Top Bar ───────────────────────────────────────────── */}
      <header className="h-16 border-b border-white/[0.08] bg-surface/85 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Workspace</span>
          </Link>

          <div className="h-4 w-px bg-white/[0.08]" />

          <div className="flex items-center gap-2 truncate">
            <span className="text-xs text-text-muted hidden sm:inline">Lobby:</span>
            <span className="text-xs font-semibold text-text truncate max-w-xs">{room.title}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Status pill */}
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
              isActive
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                : 'bg-white/[0.06] text-text-muted border-white/[0.1]'
            }`}
          >
            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            {isActive ? 'Room Active' : 'Session Ended'}
          </span>

          {/* End Room Button (Creator only) */}
          {isCreator && isActive && (
            <button
              onClick={handleEndRoom}
              disabled={isEnding}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 px-3 py-1.5 text-xs font-medium text-rose-300 transition disabled:opacity-50"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span>{isEnding ? 'Ending...' : 'End Room'}</span>
            </button>
          )}

          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text px-3 py-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Leave Room</span>
          </Link>
        </div>
      </header>

      {/* ── Status / Lifecycle Alert ──────────────────────────── */}
      {!isActive ? (
        <div className="bg-amber-500/[0.08] border-b border-amber-500/20 px-4 py-3 text-center text-xs text-amber-300">
          This interview room has concluded. Live editing and communications are closed. You can review the participant roster below.
        </div>
      ) : (
        <div className="bg-primary/[0.06] border-b border-primary/20 px-4 py-2.5 text-center text-xs text-text leading-relaxed">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary-light shrink-0" />
            <span>
              <strong>Room Lobby Ready</strong> — Live synchronized Monaco editor, WebRTC video/audio peer mesh, and whiteboard will initialize here upon Socket.IO activation.
            </span>
          </div>
        </div>
      )}

      {/* ── Main Lobby Content ────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Session Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/[0.06] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary-light bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  Interview Session
                </span>
                <span className="text-xs font-mono text-accent bg-surface-light border border-white/[0.08] px-2.5 py-0.5 rounded-md">
                  {room.roomId}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-text tracking-tight">{room.title}</h1>
              <p className="text-xs text-text-muted mt-1">
                Hosted by <strong className="text-text">{room.creator?.name || 'Session Host'}</strong> ({room.creator?.email || 'Host'})
              </p>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(room.roomId, 'id')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text bg-surface-light hover:bg-surface-lighter border border-white/[0.08] transition"
              >
                {copiedId ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">ID Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Room ID</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(inviteUrl, 'link')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-dark shadow-md shadow-primary/25 transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Copy Invite Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Session Metadata Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.06] bg-surface-light/30 p-4 space-y-1">
              <span className="text-[11px] text-text-muted flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-primary-light" />
                Target Language
              </span>
              <p className="text-sm font-semibold text-text capitalize">
                {LANGUAGE_LABELS[room.language] || room.language}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-surface-light/30 p-4 space-y-1">
              <span className="text-[11px] text-text-muted flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-accent" />
                Total Participants
              </span>
              <p className="text-sm font-semibold text-text">
                {room.participants?.length || 1} Registered Member{(room.participants?.length || 1) > 1 ? 's' : ''}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-surface-light/30 p-4 space-y-1">
              <span className="text-[11px] text-text-muted flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                Access Control
              </span>
              <p className="text-sm font-semibold text-text">
                {room.isOwner ? 'You are Host' : 'Participant'}
              </p>
            </div>
          </div>
        </div>

        {/* Participant Roster */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-light" />
              <h3 className="text-sm font-semibold text-text">Registered Participants</h3>
            </div>
            <span className="text-[11px] text-text-muted/60">
              Live presence detection activates with Socket.IO
            </span>
          </div>

          <div className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden bg-surface-light/20">
            {room.participants?.map((participant, index) => {
              const isCurrentUser =
                participant.id === user?._id ||
                participant.id === user?.id ||
                participant.email === user?.email;

              const isHost = participant.role === 'creator';

              return (
                <div
                  key={participant.id || index}
                  className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-surface-light border border-white/[0.08] flex items-center justify-center font-bold text-text text-xs">
                      {participant.name
                        ? participant.name
                            .split(' ')
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text">
                          {participant.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-primary-light bg-primary/10 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted">{participant.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        isHost
                          ? 'bg-primary/10 text-primary-light border-primary/20'
                          : 'bg-white/[0.04] text-text-muted border-white/[0.08]'
                      }`}
                    >
                      {isHost ? 'Host / Creator' : 'Candidate'}
                    </span>
                    <span className="text-[10px] text-text-muted/60 hidden sm:inline">
                      Joined {participant.joinedAt ? new Date(participant.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-Time Readiness Sandbox Preview Notice */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface/50 p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <Terminal className="h-5 w-5 text-accent shrink-0" />
            <div>
              <p className="font-semibold text-text text-xs">Real-Time Workspace Pipeline Ready</p>
              <p className="text-text-muted/70 text-[11px] mt-0.5">
                Room ID <code className="text-accent">{room.roomId}</code> is authenticated and ready for bidirectional event emission, Monaco collaborative buffers, and WebRTC streaming.
              </p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-surface-light px-4 py-2 text-xs font-medium text-text hover:bg-surface-lighter transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
