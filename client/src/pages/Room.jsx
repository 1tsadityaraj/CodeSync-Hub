import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Code2,
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Users,
  FileCode,
  AlertCircle,
  Sparkles,
  LogOut,
  StopCircle,
  RotateCw,
  CheckCircle2,
  Cloud,
  WifiOff,
  ChevronDown,
  Info,
  Download,
} from 'lucide-react';
import { roomApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCollaboration } from '../hooks/useCollaboration';

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'json', label: 'JSON', ext: 'json' },
];

export default function Room() {
  const { roomId } = useParams();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showRosterDropdown, setShowRosterDropdown] = useState(false);
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  // Initialize collaborative Yjs & Socket.IO hook
  const {
    status: socketStatus,
    saveStatus,
    lastSavedAt,
    presence,
    language,
    bindEditor,
    changeLanguage,
    getCode,
  } = useCollaboration({
    roomId,
    initialLanguage: room?.language || 'javascript',
    onRoomError: (errMsg) => {
      console.warn('Collaboration error:', errMsg);
    },
  });

  /**
   * Load room details and establish membership in MongoDB
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
      } else if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      // Ignore
    }
  };

  const handleEndRoom = async () => {
    if (
      !window.confirm(
        'Are you sure you want to end this interview room? The room will become read-only.'
      )
    ) {
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

  const handleDownloadCode = () => {
    const currentCode = getCode();
    const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.id === language) || { ext: 'txt' };
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${room?.title || 'code'}-${roomId}.${currentLangObj.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditorDidMount = (editor) => {
    bindEditor(editor);
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
          <span>Connecting to Collaborative Room...</span>
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

  // Determine active online presence count
  const activeCount = presence.length > 0 ? presence.length : 1;

  return (
    <div className="h-screen w-screen bg-bg text-text flex flex-col overflow-hidden select-none">
      {/* ── Top Header Bar ────────────────────────────────────── */}
      <header className="h-14 shrink-0 border-b border-white/[0.08] bg-surface/90 backdrop-blur-xl px-3 sm:px-5 flex items-center justify-between gap-3 z-30">
        {/* Left: Brand + Room Title & ID */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text px-2 py-1 rounded-lg hover:bg-white/[0.06] transition"
            title="Return to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline font-medium">Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />

          {/* Logo & Room Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Code2 className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xs sm:text-sm font-semibold text-text truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                {room.title}
              </h1>
              {/* Room ID Badge */}
              <button
                type="button"
                onClick={() => copyToClipboard(room.roomId, 'id')}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-accent bg-surface-light border border-white/[0.08] hover:border-white/[0.2] transition shrink-0"
                title="Click to copy Room ID"
              >
                <span>{room.roomId}</span>
                {copiedId ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-text-muted hover:text-text" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Live Connection & Save Status */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Socket Connection Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.08] bg-surface-light/40 text-[11px]">
            {socketStatus === 'connected' && (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-medium">Connected</span>
              </>
            )}
            {socketStatus === 'connecting' && (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-400 font-medium">Connecting...</span>
              </>
            )}
            {socketStatus === 'reconnecting' && (
              <>
                <RotateCw className="h-3 w-3 text-amber-400 animate-spin" />
                <span className="text-amber-400 font-medium">Reconnecting...</span>
              </>
            )}
            {socketStatus === 'disconnected' && (
              <>
                <WifiOff className="h-3 w-3 text-rose-400" />
                <span className="text-rose-400 font-medium">Disconnected</span>
              </>
            )}
          </div>

          {/* Autosave Status */}
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            {saveStatus === 'saving' ? (
              <span className="inline-flex items-center gap-1 text-primary-light">
                <svg className="h-3 w-3 animate-spin text-primary-light" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving...
              </span>
            ) : saveStatus === 'error' ? (
              <span className="inline-flex items-center gap-1 text-rose-400" title="Autosave error">
                <Cloud className="h-3 w-3" />
                Autosave failed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400/90" title={lastSavedAt ? `Saved at ${lastSavedAt.toLocaleTimeString()}` : 'Saved in cloud'}>
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Right: Presence Roster, Share, End, Leave */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Participants Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRosterDropdown(!showRosterDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-surface-light/60 hover:bg-surface-light text-xs font-medium text-text transition"
              title="View Active Participants"
            >
              <div className="relative flex items-center">
                <Users className="h-3.5 w-3.5 text-accent" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <span className="hidden sm:inline font-mono">{activeCount} online</span>
              <ChevronDown className="h-3 w-3 text-text-muted" />
            </button>

            {/* Dropdown Menu */}
            {showRosterDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/[0.1] bg-surface/95 backdrop-blur-2xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2">
                  <span className="text-xs font-semibold text-text">Active Participants</span>
                  <span className="text-[10px] text-text-muted font-mono">{activeCount} connected</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {presence.length > 0 ? (
                    presence.map((p, idx) => {
                      const isMe = p.id === user?._id || p.id === user?.id || p.email === user?.email;
                      const isHost = p.role === 'creator' || p.id === room.creator?.id;

                      return (
                        <div
                          key={p.socketId || p.id || idx}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white/[0.04] text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-md bg-surface-light border border-white/[0.08] flex items-center justify-center font-bold text-[10px] text-text shrink-0">
                              {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-text truncate flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {isMe && (
                                  <span className="text-[9px] text-primary-light bg-primary/10 px-1 py-0.2 rounded font-sans">
                                    You
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                              isHost
                                ? 'bg-primary/10 text-primary-light border border-primary/20'
                                : 'bg-white/[0.04] text-text-muted border border-white/[0.08]'
                            }`}
                          >
                            {isHost ? 'Host' : 'Member'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-2 text-xs text-text-muted">
                      {user?.name || 'You'} (Active)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={() => copyToClipboard(inviteUrl, 'link')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-dark shadow-sm transition shrink-0"
            title="Copy Invite Link"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Invite</span>
              </>
            )}
          </button>

          {/* End Room Button (Creator Only) */}
          {isCreator && isActive && (
            <button
              onClick={handleEndRoom}
              disabled={isEnding}
              className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 px-2.5 py-1.5 text-xs font-medium text-rose-300 transition disabled:opacity-50"
              title="End this session"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span>{isEnding ? 'Ending...' : 'End'}</span>
            </button>
          )}

          {/* Leave Button */}
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text px-2 py-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition"
            title="Leave room"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Leave</span>
          </Link>
        </div>
      </header>

      {/* ── Concluded Session Banner ──────────────────────────── */}
      {!isActive && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>
            This interview session has concluded. The workspace is currently in <strong>read-only</strong> mode.
          </span>
        </div>
      )}

      {/* ── Editor Toolbar (Language, Actions, Shortcuts) ──────── */}
      <div className="h-11 shrink-0 border-b border-white/[0.08] bg-[#0c1017] px-3 sm:px-5 flex items-center justify-between gap-3">
        {/* Left: Language Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-primary-light" />
            <span className="text-[11px] text-text-muted uppercase tracking-wider font-semibold hidden sm:inline">
              Language:
            </span>
            <select
              value={language}
              disabled={!isActive}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-surface-light border border-white/[0.1] text-text rounded-md px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary hover:border-white/[0.2] transition cursor-pointer disabled:opacity-50"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-surface text-text">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-3.5 w-px bg-white/[0.08] hidden sm:block" />

          {/* Live Sync Badge */}
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-text-muted">
            <Sparkles className="h-3 w-3 text-accent" />
            <span>Yjs CRDT Real-Time Sync</span>
          </span>
        </div>

        {/* Right: Quick Code Actions */}
        <div className="flex items-center gap-1.5">
          {/* Copy Code */}
          <button
            type="button"
            onClick={() => copyToClipboard(getCode(), 'code')}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-text-muted hover:text-text hover:bg-white/[0.04] transition border border-white/[0.06]"
            title="Copy all code to clipboard"
          >
            {copiedCode ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400 text-[11px]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="text-[11px] hidden sm:inline">Copy Code</span>
              </>
            )}
          </button>

          {/* Download File */}
          <button
            type="button"
            onClick={handleDownloadCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-text-muted hover:text-text hover:bg-white/[0.04] transition border border-white/[0.06]"
            title="Download source code file"
          >
            <Download className="h-3 w-3" />
            <span className="text-[11px] hidden sm:inline">Export</span>
          </button>

          {/* Toggle Info Sidebar */}
          <button
            type="button"
            onClick={() => setShowInfoSidebar(!showInfoSidebar)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition border ${
              showInfoSidebar
                ? 'bg-primary/20 text-primary-light border-primary/30'
                : 'text-text-muted hover:text-text hover:bg-white/[0.04] border-white/[0.06]'
            }`}
            title="Toggle Session Info Panel"
          >
            <Info className="h-3 w-3" />
            <span className="text-[11px] hidden sm:inline">Details</span>
          </button>
        </div>
      </div>

      {/* ── Main Workspace Body: Monaco + Optional Sidebar ────── */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden bg-[#1e1e1e]">
        {/* Monaco Editor Container */}
        <div className="flex-1 min-w-0 h-full relative">
          <Editor
            height="100%"
            width="100%"
            theme="vs-dark"
            language={language}
            options={{
              readOnly: !isActive,
              fontSize: 14,
              tabSize: 2,
              lineNumbers: 'on',
              minimap: { enabled: true, side: 'right' },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
              fontLigatures: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              contextmenu: true,
              formatOnPaste: false,
              renderWhitespace: 'selection',
            }}
            loading={
              <div className="h-full w-full bg-[#1e1e1e] flex flex-col items-center justify-center space-y-3">
                <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-xs text-text-muted">Initializing Monaco Editor...</span>
              </div>
            }
            onMount={handleEditorDidMount}
          />
        </div>

        {/* Optional Collapsible Session Info Sidebar */}
        {showInfoSidebar && (
          <aside className="w-80 shrink-0 border-l border-white/[0.08] bg-[#0d121c] p-4 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-light">
                  Session Information
                </span>
                <h3 className="text-sm font-bold text-text mt-1">{room.title}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Host: <span className="text-text">{room.creator?.name || 'Creator'}</span>
                </p>
              </div>

              {/* Room ID Copy Block */}
              <div className="rounded-xl border border-white/[0.08] bg-surface-light/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Room ID</span>
                  <span className="font-mono text-accent text-[11px]">{room.roomId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(room.roomId, 'id')}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-surface-light hover:bg-surface-lighter text-xs font-medium text-text border border-white/[0.08] transition"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Room ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status and Diagnostics */}
              <div className="rounded-xl border border-white/[0.08] bg-surface-light/40 p-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Status</span>
                  <span
                    className={`font-medium ${
                      isActive ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isActive ? 'Active' : 'Ended'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Transport</span>
                  <span className="text-text font-mono text-[11px]">Socket.IO + Yjs</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Persistence</span>
                  <span className="text-emerald-400 font-mono text-[11px]">MongoDB Debounced</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Syntax</span>
                  <span className="text-text capitalize font-mono text-[11px]">{language}</span>
                </div>
              </div>

              {/* Registered Members List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text">Session Members</span>
                  <span className="text-text-muted text-[11px] font-mono">
                    {room.participants?.length || 1}
                  </span>
                </div>

                <div className="space-y-1.5 divide-y divide-white/[0.04]">
                  {room.participants?.map((participant, index) => {
                    const isCurrentUser =
                      participant.id === user?._id ||
                      participant.id === user?.id ||
                      participant.email === user?.email;
                    const isHost = participant.role === 'creator';
                    const isOnline = presence.some(
                      (p) => p.id === participant.id || p.email === participant.email
                    );

                    return (
                      <div
                        key={participant.id || index}
                        className="pt-2 first:pt-0 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative">
                            <div className="h-6 w-6 rounded-md bg-surface-light border border-white/[0.08] flex items-center justify-center font-bold text-[10px] text-text">
                              {participant.name ? participant.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            {isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-bg" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-text truncate text-[11px] flex items-center gap-1">
                              <span>{participant.name}</span>
                              {isCurrentUser && (
                                <span className="text-[9px] text-primary-light bg-primary/10 px-1 py-0.2 rounded font-sans">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-text-muted truncate">
                              {participant.email}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            isHost
                              ? 'bg-primary/10 text-primary-light border border-primary/20'
                              : 'bg-white/[0.04] text-text-muted border border-white/[0.08]'
                          }`}
                        >
                          {isHost ? 'Host' : 'Member'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] text-center">
              <span className="text-[10px] text-text-muted/60">
                CodeSync Hub Collaborative Workspace
              </span>
            </div>
          </aside>
        )}
      </div>

      {/* ── Status Bar at Bottom ──────────────────────────────── */}
      <footer className="h-7 shrink-0 border-t border-white/[0.08] bg-[#080b11] px-4 flex items-center justify-between text-[11px] text-text-muted font-mono z-30">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Monaco Editor</span>
          </span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="hidden sm:inline">CRLF</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="capitalize">{language}</span>
          <span className="text-emerald-400/90 hidden sm:inline">
            {socketStatus === 'connected' ? '● Online' : '○ Offline'}
          </span>
        </div>
      </footer>
    </div>
  );
}
