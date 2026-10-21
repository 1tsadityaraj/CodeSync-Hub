import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, Circle } from 'lucide-react';

/* ── Fake code lines for the editor mockup ────────────────────────── */
const CODE_LINES = [
  { num: 1,  tokens: [{ t: 'keyword', v: 'async' }, { t: 'keyword', v: ' function' }, { t: 'fn', v: ' solveChallenge' }, { t: 'paren', v: '(' }, { t: 'param', v: 'input' }, { t: 'paren', v: ')' }, { t: 'plain', v: ' {' }] },
  { num: 2,  tokens: [{ t: 'keyword', v: '  const' }, { t: 'var', v: ' results' }, { t: 'plain', v: ' = ' }, { t: 'paren', v: '[]' }, { t: 'plain', v: ';' }] },
  { num: 3,  tokens: [] },
  { num: 4,  tokens: [{ t: 'keyword', v: '  for' }, { t: 'plain', v: ' (' }, { t: 'keyword', v: 'const' }, { t: 'var', v: ' item' }, { t: 'keyword', v: ' of' }, { t: 'var', v: ' input' }, { t: 'plain', v: ') {' }] },
  { num: 5,  tokens: [{ t: 'keyword', v: '    const' }, { t: 'var', v: ' processed' }, { t: 'plain', v: ' = ' }, { t: 'keyword', v: 'await' }, { t: 'fn', v: ' transform' }, { t: 'paren', v: '(' }, { t: 'var', v: 'item' }, { t: 'paren', v: ')' }, { t: 'plain', v: ';' }] },
  { num: 6,  tokens: [{ t: 'var', v: '    results' }, { t: 'plain', v: '.' }, { t: 'fn', v: 'push' }, { t: 'paren', v: '(' }, { t: 'var', v: 'processed' }, { t: 'paren', v: ')' }, { t: 'plain', v: ';' }] },
  { num: 7,  tokens: [{ t: 'plain', v: '  }' }] },
  { num: 8,  tokens: [] },
  { num: 9,  tokens: [{ t: 'keyword', v: '  return' }, { t: 'var', v: ' results' }, { t: 'plain', v: '.' }, { t: 'fn', v: 'filter' }, { t: 'paren', v: '(' }, { t: 'param', v: 'r' }, { t: 'plain', v: ' => ' }, { t: 'param', v: 'r' }, { t: 'plain', v: '.' }, { t: 'var', v: 'isValid' }, { t: 'paren', v: ')' }, { t: 'plain', v: ';' }] },
  { num: 10, tokens: [{ t: 'plain', v: '}' }] },
];

const TOKEN_COLORS = {
  keyword: 'text-purple-400',
  fn:      'text-amber-300',
  var:     'text-sky-300',
  param:   'text-orange-300',
  paren:   'text-text-muted',
  string:  'text-emerald-400',
  plain:   'text-text/80',
};

function CodeEditorMockup() {
  return (
    <div className="relative w-full max-w-xl">
      {/* Glow behind the editor */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/10 blur-2xl pointer-events-none" />

      <div className="relative rounded-xl border border-white/[0.08] bg-[#0d0d1a] shadow-2xl shadow-black/40 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-xs text-text-muted/60 font-mono">solution.js</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-text-muted/40 font-mono">JavaScript</span>
          </div>
        </div>

        {/* Code area */}
        <div className="px-4 py-3 font-mono text-[13px] leading-relaxed overflow-x-auto">
          {CODE_LINES.map(({ num, tokens }) => (
            <div key={num} className="flex">
              <span className="inline-block w-7 shrink-0 text-right mr-4 text-text-muted/30 select-none">
                {num}
              </span>
              <span className="whitespace-pre">
                {tokens.length === 0 ? '\u00A0' : tokens.map((tk, i) => (
                  <span key={i} className={TOKEN_COLORS[tk.t] || 'text-text/80'}>{tk.v}</span>
                ))}
              </span>
            </div>
          ))}
          {/* Blinking cursor */}
          <div className="flex mt-0.5">
            <span className="inline-block w-7 shrink-0 text-right mr-4 text-text-muted/30 select-none">11</span>
            <span className="inline-block w-[2px] h-[18px] bg-primary animate-pulse rounded-full" />
          </div>
        </div>

        {/* Collaboration bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div className="h-5 w-5 rounded-full bg-primary ring-2 ring-[#0d0d1a] flex items-center justify-center text-[9px] font-bold text-white">A</div>
              <div className="h-5 w-5 rounded-full bg-accent ring-2 ring-[#0d0d1a] flex items-center justify-center text-[9px] font-bold text-gray-900">B</div>
            </div>
            <span className="text-[11px] text-text-muted/50">2 collaborators</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
            <span className="text-[11px] text-emerald-400/70">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* ── Background glow ─────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-60 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/[0.08] blur-[140px]" />
        <div className="absolute top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* ── Left column — copy ─────────────────────────── */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 text-xs font-medium text-primary-light mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              Real-time collaborative platform
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl/[1.1]">
              Code Together.{' '}
              <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
                Solve Together.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg text-text-muted leading-relaxed mx-auto lg:mx-0">
              The all-in-one platform for collaborative coding interviews. Write code in real time,
              communicate face-to-face, and tackle problems on a shared whiteboard — no setup required.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                to="/get-started"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark hover:shadow-primary/35 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Start Coding
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3 text-sm font-medium text-text-muted transition hover:text-text hover:bg-white/[0.06] hover:border-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* ── Right column — editor mockup ───────────────── */}
          <div className="flex justify-center lg:justify-end">
            <CodeEditorMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
