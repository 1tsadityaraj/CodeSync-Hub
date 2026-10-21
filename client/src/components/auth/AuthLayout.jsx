import { Link } from 'react-router-dom';
import { Code2, ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 selection:bg-primary selection:text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[650px] rounded-full bg-primary/[0.08] blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 h-[400px] w-[450px] rounded-full bg-accent/[0.05] blur-[120px]" />
      </div>

      {/* Top back link */}
      <div className="relative z-10 w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text transition-colors rounded-lg py-1.5 px-2.5 -ml-2.5 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to CodeSync Hub
        </Link>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-xl p-7 sm:p-9 shadow-2xl shadow-black/50">
          {/* Logo & title header */}
          <div className="flex flex-col items-center text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 group mb-4" aria-label="CodeSync Hub home">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition group-hover:ring-primary/40 group-hover:bg-primary/15">
                <Code2 className="h-5 w-5 text-primary" strokeWidth={2.5} />
                <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
              </div>
              <span className="text-xl font-bold tracking-tight text-text">
                Code<span className="text-primary">Sync</span>{' '}
                <span className="text-text-muted font-medium">Hub</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-text-muted leading-relaxed">{subtitle}</p>}
          </div>

          {/* Form container */}
          {children}
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-text-muted/60">
          Secure, real-time developer collaboration &amp; technical interviews.
        </p>
      </div>
    </div>
  );
}
