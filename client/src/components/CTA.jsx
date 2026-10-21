import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/[0.06] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="relative mx-auto max-w-3xl rounded-3xl border border-white/[0.1] bg-surface/75 p-10 sm:p-14 text-center backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden ring-1 ring-white/[0.05]">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-primary/20 blur-3xl" />
          
          <h2 className="relative z-10 text-3xl font-extrabold tracking-tight sm:text-4xl text-text">
            Elevate your technical interviews{' '}
            <span className="bg-gradient-to-r from-primary-light via-indigo-300 to-accent bg-clip-text text-transparent">
              today.
            </span>
          </h2>
          <p className="relative z-10 mt-4 text-base text-text-muted leading-relaxed max-w-xl mx-auto">
            Zero installations, instant room sharing, real-time code synchronization, and HD audio/video calling.
          </p>
          <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-primary/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-surface-light/60 px-6 py-3.5 text-sm font-medium text-text transition hover:bg-surface-light hover:border-white/[0.2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
