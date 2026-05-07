// MetricCard.jsx — displays a single sensor metric with icon, value, and unit
export default function MetricCard({ label, value, unit, icon, accent = false }) {
  return (
    <div className={`rounded-2xl p-4 bg-white shadow-sm border flex items-center gap-4
      ${accent ? 'border-green-200' : 'border-gray-100'}`}>
      {icon && (
        <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-green-50">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-green-900">
          {value !== null && value !== undefined ? value : '—'}
          {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
