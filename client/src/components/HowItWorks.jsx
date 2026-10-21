import { DoorOpen, UserPlus, Rocket } from 'lucide-react';

const STEPS = [
  {
    icon: DoorOpen,
    number: '01',
    title: 'Create a Room',
    description:
      'Spin up a private coding room in seconds. Choose your language, set permissions, and get a unique invite link.',
  },
  {
    icon: UserPlus,
    number: '02',
    title: 'Invite Your Team',
    description:
      'Share the room link with teammates or interview candidates. They join instantly — no sign-up friction.',
  },
  {
    icon: Rocket,
    number: '03',
    title: 'Collaborate & Solve',
    description:
      'Code together in real time, communicate via video, sketch on the whiteboard, and run code — all in one place.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary-light uppercase tracking-wider mb-4">
            Workflow
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-text leading-tight">
            Up and running in{' '}
            <span className="bg-gradient-to-r from-primary-light via-indigo-300 to-accent bg-clip-text text-transparent">
              three simple steps
            </span>
          </h2>
          <p className="mt-4 text-base text-text-muted leading-relaxed">
            From zero to an active coding interview session in under 30 seconds.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6 mt-6">
          {STEPS.map(({ icon: Icon, number, title, description }, idx) => (
            <div key={number} className="relative group pt-4">
              {/* Connector line (desktop only, between cards) */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-full h-px bg-gradient-to-r from-white/[0.08] to-transparent z-0 -translate-x-3" />
              )}

              <div className="relative rounded-2xl border border-white/[0.08] bg-surface/60 p-8 transition-all duration-300 hover:border-primary/30 hover:bg-surface-light/50 hover:shadow-xl hover:shadow-black/20 text-center lg:text-left">
                {/* Step number badge */}
                <span className="absolute -top-3.5 left-8 inline-flex items-center justify-center rounded-full bg-surface-light border border-primary/30 px-3 py-0.5 text-xs font-mono font-bold text-primary-light tracking-wider shadow-sm">
                  Step {number}
                </span>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mx-auto lg:mx-0 mt-2 mb-5 transition-transform duration-300 group-hover:scale-105 group-hover:bg-primary/20">
                  <Icon className="h-5 w-5 text-primary-light" />
                </div>

                <h3 className="text-lg font-semibold text-text mb-2 tracking-tight">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
