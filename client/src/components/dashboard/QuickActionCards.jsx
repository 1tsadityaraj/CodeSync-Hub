import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, LogIn, Copy, Check, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

function generateRoomId() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const pick = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `cs-${pick(4)}-${pick(4)}`;
}

export default function QuickActionCards() {
  const navigate = useNavigate();

  // Create Room State
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // Join Room State
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreateRoom = () => {
    const newId = generateRoomId();
    setCreatedRoomId(newId);
    setCopied(false);
    setCopyError(false);
  };

  const handleCopyId = async () => {
    if (!createdRoomId) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(createdRoomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for environments where clipboard API is restricted
        const textArea = document.createElement('textarea');
        textArea.value = createdRoomId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2500);
    }
  };

  const handleEnterCreatedRoom = () => {
    if (!createdRoomId) return;
    navigate(`/room/${createdRoomId}`);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const trimmed = joinInput.trim();
    if (!trimmed) {
      setJoinError('Please enter a room ID to join');
      return;
    }
    setJoinError('');
    navigate(`/room/${encodeURIComponent(trimmed)}`);
  };

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

          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Generate an isolated, real-time collaborative coding room. Share the room ID with candidates or team members for live pair programming.
          </p>

          {/* Generated Room Display */}
          {createdRoomId && (
            <div className="mb-6 rounded-xl border border-primary/30 bg-primary/[0.08] p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-light">
                  Generated Room ID
                </span>
                <span className="text-[10px] text-text-muted">Frontend Demo ID</span>
              </div>

              <div className="flex items-center justify-between gap-2 bg-surface-light/80 border border-white/[0.08] rounded-lg px-3 py-2">
                <code className="font-mono text-sm font-semibold text-accent tracking-wide">
                  {createdRoomId}
                </code>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-text-muted hover:text-text hover:bg-white/[0.08] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label="Copy Room ID"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : copyError ? (
                    <span className="text-rose-400">Copy failed</span>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-text-muted/70 leading-normal">
                Note: Temporary frontend demo room ID. Backend room persistence &amp; WebRTC signaling will be connected in subsequent steps.
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {createdRoomId ? (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleEnterCreatedRoom}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary-dark transition active:scale-[0.98]"
              >
                <span>Enter Room</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCreateRoom}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text hover:bg-white/[0.04] transition"
              >
                Generate New
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCreateRoom}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 transition active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Create Room</span>
              <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
            </button>
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
            Received an invitation or room ID from an interviewer or team member? Paste it here to jump directly into the workspace.
          </p>

          <form onSubmit={handleJoinSubmit} className="space-y-3">
            <div>
              <label htmlFor="join-room-id" className="block text-xs font-medium text-text/80 mb-1.5">
                Room ID or URL
              </label>
              <input
                id="join-room-id"
                type="text"
                value={joinInput}
                onChange={(e) => {
                  setJoinInput(e.target.value);
                  if (joinError) setJoinError('');
                }}
                placeholder="e.g. cs-7f2a-9k4b"
                className={`w-full rounded-xl bg-surface-light/60 px-3.5 py-2.5 text-sm text-text font-mono placeholder:font-sans placeholder:text-text-muted/40 border transition-all outline-none ${
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
                <span>Join Room</span>
                <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 pt-4 border-t border-white/[0.06]">
          <p className="text-[11px] text-text-muted/60">
            Tip: You can test joining any dummy room ID (e.g. <span className="text-text font-mono">cs-demo-room</span>) to preview the room interface.
          </p>
        </div>
      </div>
    </div>
  );
}
