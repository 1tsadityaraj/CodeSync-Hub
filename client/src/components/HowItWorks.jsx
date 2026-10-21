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
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary-light tracking-wide uppercase mb-3">
            How It Works
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Up and running in{' '}
            <span className="text-primary-light">three simple steps</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
          {STEPS.map(({ icon: Icon, number, title, description }, idx) => (
            <div key={number} className="relative group">
              {/* Connector line (desktop only, between cards) */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-14 left-full w-full h-px bg-gradient-to-r from-white/[0.08] to-transparent z-0 -translate-x-3" />
              )}

              <div className="relative rounded-2xl border border-white/[0.06] bg-surface/40 p-8 transition-all duration-300 hover:border-primary/20 hover:bg-surface-light/30 text-center lg:text-left">
                {/* Step number */}
                <span className="absolute -top-3.5 left-8 lg:left-8 inline-flex items-center justify-center rounded-full bg-bg border border-primary/25 px-3 py-0.5 text-xs font-bold text-primary-light tracking-wider">
                  Step {number}
                </span>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] ring-1 ring-primary/10 mx-auto lg:mx-0 mt-3 mb-5 transition group-hover:bg-primary/[0.14] group-hover:ring-primary/25">
                  <Icon className="h-6 w-6 text-primary-light" />
                </div>

                <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
