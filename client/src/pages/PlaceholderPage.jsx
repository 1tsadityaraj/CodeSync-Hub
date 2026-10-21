import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

export default function PlaceholderPage({ title }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/[0.08] ring-1 ring-primary/15 mb-6">
        <Construction className="h-7 w-7 text-primary-light" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-sm text-text-muted leading-relaxed">
        This page is coming soon. Authentication and dashboard features will be implemented in a future step.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-light transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}
