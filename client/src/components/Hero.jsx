import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

/* ── Realistic Code Lines for Developer IDE Mockup ─────────────────── */
const CODE_LINES = [
  { num: 1, tokens: [{ t: 'keyword', v: 'export' }, { t: 'keyword', v: ' async' }, { t: 'keyword', v: ' function' }, { t: 'fn', v: ' optimizeTree' }, { t: 'paren', v: '(' }, { t: 'param', v: 'root' }, { t: 'paren', v: ')' }, { t: 'plain', v: ' {' }] },
  { num: 2, tokens: [{ t: 'keyword', v: '  if' }, { t: 'plain', v: ' (!' }, { t: 'param', v: 'root' }, { t: 'plain', v: ') ' }, { t: 'keyword', v: 'return' }, { t: 'keyword', v: ' null' }, { t: 'plain', v: ';' }] },
  { num: 3, tokens: [{ t: 'comment', v: '  // Synchronized across interviewers in real time' }] },
  { num: 4, tokens: [{ t: 'keyword', v: '  const' }, { t: 'var', v: ' left' }, { t: 'plain', v: ' = ' }, { t: 'keyword', v: 'await' }, { t: 'fn', v: ' optimizeTree' }, { t: 'paren', v: '(' }, { t: 'param', v: 'root' }, { t: 'plain', v: '.' }, { t: 'var', v: 'left' }, { t: 'paren', v: ')' }, { t: 'plain', v: ';' }] },
  { num: 5, tokens: [{ t: 'keyword', v: '  const' }, { t: 'var', v: ' right' }, { t: 'plain', v: ' = ' }, { t: 'keyword', v: 'await' }, { t: 'fn', v: ' optimizeTree' }, { t: 'paren', v: '(' }, { t: 'param', v: 'root' }, { t: 'plain', v: '.' }, { t: 'var', v: 'right' }, { t: 'paren', v: ')' }, { t: 'plain', v: ';' }], cursor: 'Sarah' },
  { num: 6, tokens: [{ t: 'keyword', v: '  return' }, { t: 'keyword', v: ' new' }, { t: 'fn', v: ' TreeNode' }, { t: 'paren', v: '(' }, { t: 'param', v: 'root' }, { t: 'plain', v: '.' }, { t: 'var', v: 'val' }, { t: 'plain', v: ', ' }, { t: 'var', v: 'right' }, { t: 'plain', v: ', ' }, { t: 'var', v: 'left' }, { t: 'paren', v: ')' }, { t: 'plain', v: ';' }] },
  { num: 7, tokens: [{ t: 'plain', v: '}' }] },
  { num: 8, tokens: [] },
  { num: 9, tokens: [{ t: 'keyword', v: 'const' }, { t: 'var', v: ' metrics' }, { t: 'plain', v: ' = ' }, { t: 'fn', v: 'evaluatePerformance' }, { t: 'paren', v: '(' }, { t: 'var', v: 'optimizeTree' }, { t: 'paren', v: ')' }, { t: 'plain', v: ';' }], cursor: 'Alex' },
  { num: 10, tokens: [{ t: 'keyword', v: 'console' }, { t: 'plain', v: '.' }, { t: 'fn', v: 'log' }, { t: 'paren', v: '(' }, { t: 'string', v: '"Complexity: O(N) space-time"' }, { t: 'paren', v: ')' }, { t: 'plain', v: ';' }] },
];

const TOKEN_COLORS = {
  keyword: 'text-indigo-400 font-medium',
  fn:      'text-sky-300',
  var:     'text-slate-200',
  param:   'text-amber-300',
  paren:   'text-slate-400',
  string:  'text-emerald-400',
  comment: 'text-slate-500 italic',
  plain:   'text-slate-300',
};

function CodeEditorMockup() {
  return (
    <div className="relative w-full max-w-xl">
      {/* Restrained developer tool ambient glow */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-primary/15 via-primary-dark/10 to-accent/10 blur-xl pointer-events-none" />

      <div className="relative rounded-2xl border border-white/[0.1] bg-[#0c101a] shadow-2xl shadow-black/60 overflow-hidden ring-1 ring-white/[0.05]">
        {/* IDE Window Controls & Tabs */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-[#090d16]">
          {/* Window dots */}
          <div className="flex items-center gap-1.5 pl-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#0c101a] border border-white/[0.08] text-xs font-mono text-slate-200">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>solution.js</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono text-slate-500 hover:text-slate-400">
              <span>test.spec.ts</span>
            </div>
          </div>

          {/* Right: Live Sync Pill */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          </div>
        </div>

        {/* Code Content with Line Numbers & Remote Cursors */}
        <div className="p-4 font-mono text-[12px] sm:text-[13px] leading-relaxed overflow-x-auto bg-[#0a0e17]">
          {CODE_LINES.map(({ num, tokens, cursor }) => (
            <div key={num} className="flex items-center relative group py-0.5">
              <span className="inline-block w-6 shrink-0 text-right mr-4 text-slate-600 select-none text-[11px]">
                {num}
              </span>
              <span className="whitespace-pre flex-1">
                {tokens.length === 0 ? '\u00A0' : tokens.map((tk, i) => (
                  <span key={i} className={TOKEN_COLORS[tk.t] || 'text-slate-300'}>{tk.v}</span>
                ))}
              </span>

              {/* Collaborative Cursor Indicator */}
              {cursor === 'Sarah' && (
                <div className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-[10px] text-indigo-300 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                  <span>Sarah</span>
                </div>
              )}

              {cursor === 'Alex' && (
                <div className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/30 text-[10px] text-sky-300 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span>Alex</span>
                </div>
              )}
            </div>
          ))}

          {/* Active Caret */}
          <div className="flex items-center mt-1">
            <span className="inline-block w-6 shrink-0 text-right mr-4 text-slate-600 select-none text-[11px]">11</span>
            <span className="inline-block w-[2px] h-[16px] bg-primary-light animate-pulse rounded-full" />
          </div>
        </div>

        {/* Bottom Status & Test Diagnostics */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.06] bg-[#090d16] text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>12 Tests Passing</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">Node v20.11</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div className="h-5 w-5 rounded-full bg-indigo-600 ring-2 ring-[#090d16] flex items-center justify-center text-[9px] font-bold text-white">S</div>
              <div className="h-5 w-5 rounded-full bg-sky-500 ring-2 ring-[#090d16] flex items-center justify-center text-[9px] font-bold text-slate-900">A</div>
            </div>
            <span className="text-slate-400 text-[11px]">2 in room</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/[0.07] blur-[140px]" />
        <div className="absolute top-40 right-1/4 h-[350px] w-[450px] rounded-full bg-accent/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left column — Typography & Actions */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-3.5 py-1.5 text-xs font-semibold text-primary-light mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary-light" />
              Next-Gen Coding Interview Workspace
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-text leading-[1.12]">
              Real-Time Collaboration.{' '}
              <span className="bg-gradient-to-r from-primary-light via-indigo-300 to-accent bg-clip-text text-transparent">
                Zero Friction.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base sm:text-lg text-text-muted leading-relaxed mx-auto lg:mx-0">
              The purpose-built platform for technical interviews and pair programming. Code collaboratively with Monaco and Yjs, discuss architectures on a shared whiteboard, and connect via peer-to-peer video calling.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-primary/35 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Start Free Session
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-surface/80 px-6 py-3 text-sm font-medium text-text transition hover:bg-surface-light hover:border-white/[0.2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Go to Workspace
              </Link>
            </div>

            {/* Feature checklist */}
            <div className="mt-8 pt-8 border-t border-white/[0.06] flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Monaco Editor &amp; Yjs CRDT
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Live Whiteboard
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                WebRTC Audio &amp; Video
              </span>
            </div>
          </div>

          {/* Right column — Refined IDE Mockup */}
          <div className="flex justify-center lg:justify-end">
            <CodeEditorMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
