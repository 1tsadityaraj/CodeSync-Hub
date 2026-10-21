import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  LogIn,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { roomApi } from '../../lib/api';

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

export default function QuickActionCards({ onRoomCreated }) {
  const navigate = useNavigate();

  // Create Room State
  const [title, setTitle] = useState('Collaborative Interview Session');
  const [language, setLanguage] = useState('javascript');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Join Room State
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreateRoom = async (e) => {
    e?.preventDefault();
    setIsCreating(true);
    setCreateError('');

    try {
      const data = await roomApi.createRoom({
        title: title.trim() || 'Collaborative Interview Session',
        language,
      });

      setCreatedRoom(data.room);
      if (onRoomCreated) {
        onRoomCreated(data.room);
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create interview room');
    } finally {
      setIsCreating(false);
    }
  };

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
      // Fallback
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const raw = joinInput.trim();
    if (!raw) {
      setJoinError('Please enter a room ID to join');
      return;
    }

    // If user pasted a full URL like http://localhost:5173/room/cs-xxxx-xxxx, extract the ID
    let cleanId = raw;
    if (raw.includes('/room/')) {
      const parts = raw.split('/room/');
      cleanId = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
    }

    if (!cleanId) {
      setJoinError('Invalid room link or ID');
      return;
    }

    setJoinError('');
    navigate(`/room/${encodeURIComponent(cleanId)}`);
  };

  const inviteLink = createdRoom
    ? `${window.location.origin}/room/${createdRoom.roomId}`
    : '';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Card 1: Create Interview Room ─────────────────────── */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-primary/30">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/25 text-primary-light">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text">Create Interview Room</h3>
              <p className="text-xs text-text-muted">Instant private coding workspace</p>
            </div>
          </div>

          <p className="text-sm text-text-muted leading-relaxed mb-5">
            Spin up a server-verified interview room with unique session identifiers, multi-language support, and participant roster tracking.
          </p>

          {createError && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] p-3 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {/* Form inputs if not created yet */}
          {!createdRoom ? (
            <form onSubmit={handleCreateRoom} className="space-y-3.5 mb-5">
              <div>
                <label htmlFor="room-title-input" className="block text-xs font-medium text-text/80 mb-1">
                  Session Title
                </label>
                <input
                  id="room-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Architecture Round"
                  disabled={isCreating}
                  className="w-full rounded-xl bg-surface-light/60 px-3.5 py-2 text-sm text-text placeholder:text-text-muted/40 border border-white/[0.08] focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="room-language-select" className="block text-xs font-medium text-text/80 mb-1">
                  Default Programming Language
                </label>
                <select
                  id="room-language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isCreating}
                  className="w-full rounded-xl bg-surface-light/60 px-3.5 py-2 text-sm text-text border border-white/[0.08] focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none transition cursor-pointer"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-surface text-text">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Creating Room...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Create Room</span>
                      <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Created Room Success View */
            <div className="mb-5 rounded-xl border border-primary/30 bg-primary/[0.08] p-4 space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-light">
                  Active Room Created
                </span>
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                  Status: Active
                </span>
              </div>

              {/* Room ID row */}
              <div className="flex items-center justify-between gap-2 bg-surface-light/80 border border-white/[0.08] rounded-lg px-3 py-2">
                <div>
                  <p className="text-[10px] text-text-muted">Room ID</p>
                  <code className="font-mono text-sm font-bold text-accent tracking-wide">
                    {createdRoom.roomId}
                  </code>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(createdRoom.roomId, 'id')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-text-muted hover:text-text hover:bg-white/[0.08] transition"
                  aria-label="Copy Room ID"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Copy invite link button */}
              <button
                type="button"
                onClick={() => copyToClipboard(inviteLink, 'link')}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-surface-light border border-white/[0.08] px-3 py-2 text-xs font-medium text-text-muted hover:text-text hover:bg-white/[0.06] transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Invite Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 text-primary-light" />
                    <span>Copy Full Invitation Link</span>
                  </>
                )}
              </button>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigate(`/room/${createdRoom.roomId}`)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary-dark transition active:scale-[0.98]"
                >
                  <span>Enter Room Lobby</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedRoom(null)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-medium text-text-muted hover:text-text hover:bg-white/[0.04] transition"
                >
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Card 2: Join Interview Room ───────────────────────── */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-accent/30">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/25 text-accent">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text">Join Interview Room</h3>
              <p className="text-xs text-text-muted">Enter an active session code</p>
            </div>
          </div>

          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Paste a room ID or invitation link received from an interviewer to join the collaborative lobby and workspace.
          </p>

          <form onSubmit={handleJoinSubmit} className="space-y-3">
            <div>
              <label htmlFor="join-room-id" className="block text-xs font-medium text-text/80 mb-1.5">
                Room ID or Invitation URL
              </label>
              <input
                id="join-room-id"
                type="text"
                value={joinInput}
                onChange={(e) => {
                  setJoinInput(e.target.value);
                  if (joinError) setJoinError('');
                }}
                placeholder="e.g. cs-a8f2-3c9d or https://.../room/cs-a8f2-3c9d"
                className={`w-full rounded-xl bg-surface-light/60 px-4 py-3 text-sm text-text font-mono placeholder:font-sans placeholder:text-text-muted/40 border transition-all outline-none ${
                  joinError
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-white/[0.08] focus:border-accent/80 focus:ring-2 focus:ring-accent/20 hover:border-white/[0.14]'
                }`}
              />
              {joinError && (
                <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium pt-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{joinError}</span>
                </p>
              )}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-surface-lighter hover:bg-white/[0.1] border border-white/[0.1] px-4 py-3 text-sm font-semibold text-text shadow-md transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <span>Enter Room Lobby</span>
                <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 pt-4 border-t border-white/[0.06]">
          <p className="text-[11px] text-text-muted/60">
            Note: Rooms verify membership on join and enforce creator-controlled lifecycle status.
          </p>
        </div>
      </div>
    </div>
  );
}
