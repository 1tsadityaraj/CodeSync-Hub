import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Code2,
  ArrowLeft,
  Copy,
  Check,
  Video,
  Mic,
  Monitor,
  PenTool,
  Play,
  Users,
  Terminal,
  Info,
  Sparkles,
} from 'lucide-react';

export default function Room() {
  const { roomId } = useParams();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      {/* ── Room Top Bar ────────────────────────────────────────── */}
      <header className="h-14 border-b border-white/[0.08] bg-surface/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-white/[0.08]" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Room:</span>
            <code className="text-xs font-mono font-semibold text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-md">
              {roomId || 'demo-room'}
            </code>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text px-2 py-0.5 rounded hover:bg-white/[0.06] transition"
              title="Copy invite URL"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px] font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="text-[11px] hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status & actions */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Preview
          </span>

          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-text-muted bg-surface-light px-2.5 py-1 rounded-lg border border-white/[0.06]">
            <Users className="h-3.5 w-3.5 text-primary-light" />
            1 Participant (You)
          </span>
        </div>
      </header>

      {/* ── Notification Banner ───────────────────────────────── */}
      <div className="bg-primary/[0.08] border-b border-primary/20 px-4 py-2.5 text-center text-xs text-text leading-relaxed">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary-light shrink-0" />
          <span>
            <strong>Room Workspace Connected</strong> — Real-time Monaco editor sync, WebRTC video calling, shared whiteboard, and Judge0 code execution will be linked in upcoming development steps.
          </span>
        </div>
      </div>

      {/* ── Mock Room Interface ───────────────────────────────── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/[0.06] overflow-hidden">
        {/* Editor Area (Left 8 cols) */}
        <div className="lg:col-span-8 bg-surface/40 flex flex-col p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary-light" />
              <span className="text-xs font-semibold text-text">main.js</span>
              <span className="text-[10px] text-text-muted/60 bg-white/[0.04] px-2 py-0.5 rounded">
                JavaScript
              </span>
            </div>
            <button
              disabled
              className="flex items-center gap-1.5 bg-primary/20 text-primary-light border border-primary/30 px-3 py-1 rounded-lg text-xs font-medium cursor-not-allowed opacity-75"
            >
              <Play className="h-3.5 w-3.5" />
              Run Code (Judge0)
            </button>
          </div>

          {/* Code mock representation */}
          <div className="flex-1 rounded-xl border border-white/[0.06] bg-[#0c0c18] p-4 font-mono text-xs text-text/80 space-y-1 overflow-x-auto min-h-[280px]">
            <p className="text-text-muted/50 select-none">// CodeSync Hub — Collaborative Room Session</p>
            <p className="text-text-muted/50 select-none">// Room ID: {roomId}</p>
            <p className="text-text-muted/50 select-none">// Real-time collaborative Monaco editor will mount here</p>
            <p>&nbsp;</p>
            <p><span className="text-purple-400">function</span> <span className="text-amber-300">collaborativeSolution</span>(<span className="text-orange-300">args</span>) &#123;</p>
            <p className="pl-4"><span className="text-text-muted">// Write your algorithm code here</span></p>
            <p className="pl-4"><span className="text-purple-400">return</span> <span className="text-emerald-400">&quot;Ready for live interview&quot;</span>;</p>
            <p>&#125;</p>
          </div>

          {/* Console / Output Drawer Mock */}
          <div className="rounded-xl border border-white/[0.06] bg-surface/60 p-3.5">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-text-muted">
              <Terminal className="h-3.5 w-3.5" />
              <span>Console Output</span>
            </div>
            <p className="text-xs font-mono text-emerald-400/80">
              ⚡ Room session initialized. Waiting for execution trigger...
            </p>
          </div>
        </div>

        {/* Sidebar Controls (Right 4 cols) */}
        <div className="lg:col-span-4 bg-surface/60 flex flex-col p-4 sm:p-6 space-y-5 border-t lg:border-t-0 border-white/[0.06]">
          {/* Video Call Mock Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-text">
              <div className="flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-accent" />
                <span>Video Call (WebRTC)</span>
              </div>
              <span className="text-[10px] text-text-muted">Audio Ready</span>
            </div>

            <div className="h-44 rounded-xl border border-white/[0.06] bg-surface-light/40 flex flex-col items-center justify-center text-center p-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light mb-2">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-text">Camera &amp; Audio Stream</p>
              <p className="text-[11px] text-text-muted mt-1 max-w-xs">
                Peer-to-peer WebRTC video mesh will initialize when participants connect.
              </p>
            </div>
          </div>

          {/* Whiteboard / Tools Mock Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-text">
              <div className="flex items-center gap-1.5">
                <PenTool className="h-3.5 w-3.5 text-primary-light" />
                <span>Shared Whiteboard</span>
              </div>
              <span className="text-[10px] text-text-muted">Canvas</span>
            </div>

            <div className="h-36 rounded-xl border border-white/[0.06] bg-surface-light/30 flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs font-medium text-text">Interactive Canvas</p>
              <p className="text-[11px] text-text-muted mt-1">
                Draw system architecture diagrams and algorithms collaboratively.
              </p>
            </div>
          </div>

          {/* Quick Exit */}
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-surface-light/60 border border-white/[0.08] hover:bg-surface-light px-4 py-2.5 text-xs font-medium text-text transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Workspace Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
