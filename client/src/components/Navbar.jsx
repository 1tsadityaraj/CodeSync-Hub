import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchor = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/10'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* ── Brand ─────────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="CodeSync Hub home">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 transition group-hover:ring-primary/40">
            <Code2 className="h-5 w-5 text-primary" strokeWidth={2.5} />
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </div>
          <span className="text-lg font-bold tracking-tight text-text">
            Code<span className="text-primary">Sync</span>{' '}
            <span className="text-text-muted font-medium">Hub</span>
          </span>
        </Link>

        {/* ── Desktop links ────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                onClick={(e) => handleAnchor(e, href)}
                className="text-sm font-medium text-text-muted transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* ── Desktop actions ──────────────────────────────── */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-muted transition hover:text-text hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Get Started
          </Link>
        </div>

        {/* ── Mobile toggle ────────────────────────────────── */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-text-muted transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* ── Mobile menu ──────────────────────────────────── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-80 border-b border-white/[0.06]' : 'max-h-0'
        }`}
      >
        <div className="px-6 pb-6 pt-2 space-y-1 bg-surface/90 backdrop-blur-xl">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => handleAnchor(e, href)}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-text-muted transition hover:text-text hover:bg-white/[0.04]"
            >
              {label}
            </a>
          ))}
          <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-2">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-text-muted transition hover:text-text hover:bg-white/[0.04] text-center"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white text-center shadow-md shadow-primary/20 transition hover:bg-primary-dark"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
