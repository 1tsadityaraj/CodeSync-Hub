import { Code, Video, Clock, Info } from 'lucide-react';

const STATS = [
  {
    id: 'sessions',
    label: 'Total Sessions',
    value: '14',
    change: '+3 this week',
    icon: Code,
    color: 'from-blue-500/20 to-indigo-500/10 text-primary-light',
  },
  {
    id: 'rooms',
    label: 'Rooms Created',
    value: '8',
    change: '2 active today',
    icon: Video,
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400',
  },
  {
    id: 'hours',
    label: 'Collaboration Hours',
    value: '32.4h',
    change: '~2.3h / session avg',
    icon: Clock,
    color: 'from-violet-500/20 to-purple-500/10 text-accent',
  },
];

export default function StatsCards() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Workspace Metrics</h3>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-muted/60 bg-white/[0.03] border border-white/[0.06] px-2.5 py-0.5 rounded-full">
          <Info className="h-3 w-3" /> Demo Metrics
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map(({ id, label, value, change, icon: Icon, color }) => (
          <div
            key={id}
            className="group relative rounded-2xl border border-white/[0.06] bg-surface/60 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-surface-light/40 hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-text-muted">{label}</span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} ring-1 ring-white/10`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-text">{value}</span>
              <span className="text-[11px] text-text-muted/60 font-medium">{change}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
