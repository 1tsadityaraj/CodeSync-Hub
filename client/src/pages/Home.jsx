import { useState, useEffect } from 'react';
import { Code2, Wifi, WifiOff, ArrowRight, Users, MonitorPlay, Pencil } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Home() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/health')
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface/70 border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Code2 className="h-7 w-7 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CodeSync Hub
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium">
            {health ? (
              <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-success">
                <Wifi className="h-3.5 w-3.5" /> API Connected
              </span>
            ) : error ? (
              <span className="flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-danger">
                <WifiOff className="h-3.5 w-3.5" /> API Offline
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-warning animate-pulse">
                Connecting…
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/15 blur-[120px]" />
        </div>

        <h1 className="relative z-10 max-w-3xl text-5xl/tight font-extrabold tracking-tight sm:text-6xl/tight">
          Real-time{' '}
          <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
            Collaborative Coding
          </span>{' '}
          &amp; Interviews
        </h1>

        <p className="relative z-10 mt-6 max-w-xl text-lg text-text-muted">
          Create rooms, write code together, hop on a video call, sketch on a
          shared whiteboard, and execute programs — all in one place.
        </p>

        <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            className="group flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark hover:shadow-primary/40 active:scale-[.98] cursor-default"
            disabled
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 mt-16 grid gap-4 sm:grid-cols-3 max-w-2xl w-full">
          {[
            { icon: Users,        label: 'Live Collaboration' },
            { icon: MonitorPlay,  label: 'Video Interviews' },
            { icon: Pencil,       label: 'Shared Whiteboard' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl bg-surface-light/60 px-5 py-4 ring-1 ring-white/5 backdrop-blur transition hover:ring-primary/30"
            >
              <Icon className="h-5 w-5 text-primary-light" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="py-6 text-center text-xs text-text-muted/60">
        © {new Date().getFullYear()} CodeSync Hub
      </footer>
    </div>
  );
}
