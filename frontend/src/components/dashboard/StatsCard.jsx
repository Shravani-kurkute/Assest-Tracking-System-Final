// Small reusable metric card used on dashboard and reporting pages.

export default function StatsCard({ title, value, icon, color, subtitle }) {
  const Icon = icon;

  return (
    <div className="card relative overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/80">
      <div className={`absolute inset-x-0 top-0 h-1 ${color.accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color.soft} shadow-inner`}
        >
          <Icon className={`h-6 w-6 ${color.text}`} />
        </div>
      </div>
    </div>
  );
}
