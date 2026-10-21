import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/[0.06] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.06] bg-surface/50 p-10 sm:p-14 text-center backdrop-blur-sm">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Your next great coding session{' '}
            <span className="text-primary-light">starts here.</span>
          </h2>
          <p className="mt-4 text-text-muted leading-relaxed">
            Create a room, invite your team, and start solving problems together in seconds.
          </p>
          <Link
            to="/signup"
            className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark hover:shadow-primary/35 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
