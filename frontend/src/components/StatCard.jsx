export default function StatCard({ label, value, tone = 'default', sub }) {
  const toneClasses = {
    default: 'text-white',
    accent: 'text-accent',
    warn: 'text-accent2',
    danger: 'text-danger',
  };

  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-mist uppercase tracking-wide">{label}</p>
      <p className={`font-display text-3xl font-semibold mt-2 ${toneClasses[tone]}`}>{value}</p>
      {sub && <p className="text-xs text-mist mt-1">{sub}</p>}
    </div>
  );
}
