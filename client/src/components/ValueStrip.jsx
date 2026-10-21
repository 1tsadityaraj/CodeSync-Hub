import { Users, Briefcase, Code2 } from 'lucide-react';

const VALUES = [
  {
    icon: Users,
    title: 'Live Collaboration',
    description: 'Edit code simultaneously with real-time sync.',
  },
  {
    icon: Briefcase,
    title: 'Interview Ready',
    description: 'Purpose-built for technical interview workflows.',
  },
  {
    icon: Code2,
    title: 'Developer Focused',
    description: 'Tools designed by developers, for developers.',
  },
];

export default function ValueStrip() {
  return (
    <section className="relative border-y border-white/[0.04] bg-white/[0.01]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 sm:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-4 group">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] ring-1 ring-primary/10 transition group-hover:ring-primary/25 group-hover:bg-primary/[0.12]">
                <Icon className="h-5 w-5 text-primary-light" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text">{title}</h3>
                <p className="mt-1 text-sm text-text-muted leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
