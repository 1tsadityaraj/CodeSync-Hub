import { Video, CheckCircle2, Crown, Sparkles } from 'lucide-react';

export default function StatsCards({ rooms = [], loading = false }) {
  const activeRoomsCount = rooms.filter((r) => r.status === 'active').length;
  const totalRoomsCount = rooms.length;
  const hostedRoomsCount = rooms.filter((r) => r.isOwner).length;

  const stats = [
    {
      id: 'active',
      label: 'Active Interview Rooms',
      value: activeRoomsCount,
      sublabel: activeRoomsCount === 1 ? '1 room open now' : `${activeRoomsCount} rooms open now`,
      icon: Video,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400',
      badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    },
    {
      id: 'total',
      label: 'Total Sessions',
      value: totalRoomsCount,
      sublabel: 'Recorded in workspace',
      icon: CheckCircle2,
      color: 'from-blue-500/20 to-indigo-500/10 text-primary-light',
      badgeColor: 'text-primary-light bg-primary/10 border-primary/20',
    },
    {
      id: 'hosted',
      label: 'Hosted by You',
      value: hostedRoomsCount,
      sublabel: 'Created as session host',
      icon: Crown,
      color: 'from-violet-500/20 to-purple-500/10 text-accent',
      badgeColor: 'text-accent bg-accent/10 border-accent/20',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-light" />
          <span>Workspace Overview</span>
        </h3>
        <span className="text-[11px] font-medium text-text-muted/70 bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 rounded-full">
          Real-time Database Status
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ id, label, value, sublabel, icon: Icon, color, badgeColor }) => (
          <div
            key={id}
            className="group relative rounded-2xl border border-white/[0.08] bg-surface/70 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16] hover:bg-surface-light/50 hover:shadow-lg hover:shadow-black/30"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-text-muted">{label}</span>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              {loading ? (
                <div className="h-8 w-12 bg-white/[0.08] rounded animate-pulse" />
              ) : (
                <span className="text-3xl font-extrabold tracking-tight text-text font-mono">
                  {value}
                </span>
              )}
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>
                {sublabel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
