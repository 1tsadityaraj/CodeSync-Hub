import { Sparkles, Terminal, Users, PlayCircle } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Start an Interview Session',
    desc: 'Click "Create Room" to spin up a private sandbox with a unique session ID.',
    icon: Terminal,
  },
  {
    step: '02',
    title: 'Invite Your Participant',
    desc: 'Share the generated Room ID or direct URL with your candidate or peer.',
    icon: Users,
  },
  {
    step: '03',
    title: 'Write & Execute Code',
    desc: 'Collaborate live with syntax highlighting, compiler execution, and whiteboard sketching.',
    icon: PlayCircle,
  },
];

export default function GettingStartedGuide() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-surface/50 p-6 sm:p-7 backdrop-blur-xl space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary-light" />
        <h3 className="text-sm font-semibold text-text">Platform Quickstart</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map(({ step, title, desc, icon: Icon }) => (
          <div
            key={step}
            className="rounded-xl border border-white/[0.04] bg-surface-light/30 p-4 space-y-2.5 transition hover:border-white/[0.1] hover:bg-surface-light/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-primary-light bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                Step {step}
              </span>
              <Icon className="h-4 w-4 text-text-muted/60" />
            </div>
            <h4 className="text-xs font-semibold text-text">{title}</h4>
            <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
