import { Code2, Video, PenTool, Play, Lock, MonitorSmartphone } from 'lucide-react';

const FEATURES = [
  {
    icon: Code2,
    title: 'Real-Time Collaborative Editor',
    description:
      'Write, review, and debug code together with live cursors and instant synchronization across all participants.',
  },
  {
    icon: Video,
    title: 'Integrated Video & Audio',
    description:
      'Hop on a built-in video call without leaving the platform — no third-party apps needed.',
  },
  {
    icon: PenTool,
    title: 'Shared Whiteboard',
    description:
      'Sketch ideas, diagram algorithms, and explain concepts visually on an infinite collaborative canvas.',
  },
  {
    icon: Play,
    title: 'Multi-Language Code Execution',
    description:
      'Run code in JavaScript, Python, C++, Java, and more — right from the editor with instant output.',
  },
  {
    icon: Lock,
    title: 'Private Interview Rooms',
    description:
      'Create secure, isolated rooms with unique invite links for confidential technical interviews.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Works Everywhere',
    description:
      'Fully responsive design that works seamlessly on desktop, tablet, and mobile browsers.',
  },
];

export default function Features() {
  return (
    <section id="features" className="relative scroll-mt-20">
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary-light tracking-wide uppercase mb-3">
            Features
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you need to{' '}
            <span className="text-primary-light">collaborate effectively</span>
          </h2>
          <p className="mt-4 text-text-muted leading-relaxed">
            A complete toolkit for pair programming, technical interviews, and team problem-solving sessions.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group rounded-2xl border border-white/[0.06] bg-surface/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-surface-light/40 hover:shadow-lg hover:shadow-primary/[0.04]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/[0.08] ring-1 ring-primary/10 transition group-hover:bg-primary/[0.14] group-hover:ring-primary/25 mb-5">
                <Icon className="h-5 w-5 text-primary-light" />
              </div>
              <h3 className="text-base font-semibold text-text mb-2">{title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
