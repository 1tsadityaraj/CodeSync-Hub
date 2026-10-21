import { Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';

const FOOTER_LINKS = [
  { label: 'Features', href: '#features', isAnchor: true },
  { label: 'How It Works', href: '#how-it-works', isAnchor: true },
  { label: 'About', href: '#about', isAnchor: true },
  { label: 'Log in', href: '/login', isAnchor: false },
  { label: 'Get Started', href: '/get-started', isAnchor: false },
];

export default function Footer() {
  const handleAnchor = (e, href) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="about" className="border-t border-white/[0.04] scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Code2 className="h-4 w-4 text-primary" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight text-text">
              Code<span className="text-primary">Sync</span>{' '}
              <span className="text-text-muted font-medium">Hub</span>
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Footer navigation">
            {FOOTER_LINKS.map(({ label, href, isAnchor }) =>
              isAnchor ? (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => handleAnchor(e, href)}
                  className="text-sm text-text-muted transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  to={href}
                  className="text-sm text-text-muted transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
                >
                  {label}
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-white/[0.04] pt-6 text-center">
          <p className="text-xs text-text-muted/50">
            © {new Date().getFullYear()} CodeSync Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
