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

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary-light uppercase tracking-wider mb-4">
            Capabilities
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-text leading-tight">
            Everything you need for{' '}
            <span className="bg-gradient-to-r from-primary-light via-indigo-300 to-accent bg-clip-text text-transparent">
              high-signal technical interviews
            </span>
          </h2>
          <p className="mt-4 text-base text-text-muted leading-relaxed max-w-2xl mx-auto">
            A comprehensive, low-latency toolkit engineered for technical assessments, pair programming, and collaborative architecture design.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group relative rounded-2xl border border-white/[0.08] bg-surface/60 p-6 transition-all duration-300 hover:border-primary/30 hover:bg-surface-light/50 hover:shadow-xl hover:shadow-black/20"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 transition-transform duration-300 group-hover:scale-105 group-hover:bg-primary/20 mb-5">
                <Icon className="h-5 w-5 text-primary-light" />
              </div>
              <h3 className="text-base font-semibold text-text mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
