// Overview.jsx — main dashboard page showing latest plant state
import { Link } from 'react-router-dom';
import { useTelemetry } from '../hooks/useTelemetry';
import { useNightMode } from '../hooks/useNightMode';
import { evaluateHealth } from '../utils/plantHealth';
import { getDetailedWateringAdvice } from '../utils/wateringLogic';
import { timeAgo, formatValue } from '../utils/formatters';
import SectionTitle from '../components/common/SectionTitle';
import Spinner from '../components/common/Spinner';
import MetricCard from '../components/cards/MetricCard';
import SummaryCard from '../components/cards/SummaryCard';
import StatusBadge from '../components/cards/StatusBadge';

const metrics = [
  { key: 'temperature',  label: 'Temperature',   unit: '°C' },
  { key: 'airHumidity',  label: 'Air Humidity',  unit: '%' },
  { key: 'soilMoisture', label: 'Soil Moisture', unit: '%' },
  { key: 'lightLevel',   label: 'Light Level',   unit: 'lux' },
];

const urgencyStyles = {
  ok:   { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  dot: 'bg-green-500' },
  soon: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  now:  { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    dot: 'bg-red-500' },
};

export default function Overview() {
  const { telemetry, plantInfo, loading, error } = useTelemetry();
  const streakCount = telemetry?.careStreak ?? 1;
  const isNightMode = useNightMode();

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-sm p-4">{error}</p>;

  const { status, issues, soilAssessment } = evaluateHealth(telemetry, { isNightMode });
  const { urgency, title: waterTitle, body: waterBody } = getDetailedWateringAdvice(telemetry);
  const wStyle = urgencyStyles[urgency];

  const handleOpenHistory = () => { 
    window.open("https://eu.thingsboard.cloud/dashboard/45f3fa20-555e-11f1-be5a-b9befc3a4888?publicId=1eb36ba0-539a-11f1-be5a-b9befc3a4888", "_blank", "noopener,noreferrer"); 
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle
            title={plantInfo?.name ?? 'My Plant'}
            subtitle={plantInfo?.location}
          />
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-sm font-semibold text-orange-700 shadow-sm">
            <span aria-hidden="true">🔥</span>
            <span>Care Streak: {streakCount} days</span>
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Keep checking GrowCloud daily to maintain your healthy plant care routine!
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Last updated {timeAgo(telemetry.timestamp)}
        </p>
      </div>

      {/* Overall plant condition */}
      <div className="flex items-center gap-3 mb-4">
        <StatusBadge status={status} />
        <span className="text-sm text-gray-400">Plant condition</span>
      </div>

      {/* Watering recommendation — primary action */}
      <Link to="/watering" className="block mb-6">
        <div className={`rounded-2xl border-2 ${wStyle.border} ${wStyle.bg} px-5 py-4
          flex items-center gap-4 hover:opacity-90 transition-opacity`}>
          <span className={`h-3 w-3 rounded-full shrink-0 ${wStyle.dot}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${wStyle.text}`}>{waterTitle}</p>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">{waterBody}</p>
          </div>
          <span className="text-xs text-gray-400 shrink-0 hidden sm:block">View guidance</span>
        </div>
      </Link>

      {soilAssessment?.severity === 'critical_over_saturated' && (
        <div className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-4 text-red-800 shadow-sm">
          <p className="text-sm font-bold">{soilAssessment.issue}</p>
          <p className="text-xs mt-1 text-red-700">{soilAssessment.advice}</p>
        </div>
      )}

      <SummaryCard className={`mb-6 border-2 ${soilAssessment.borderClass}`}>
        <div className="flex items-start gap-4">
          <span className={`h-3.5 w-3.5 rounded-full shrink-0 mt-1.5 ${soilAssessment.colorClass.split(' ')[0]}`} />
          <div>
            <p className="text-sm font-semibold text-gray-800">Soil Moisture Status</p>
            <p className="text-sm text-gray-600 mt-1">{soilAssessment.note}</p>
          </div>
          <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${soilAssessment.colorClass}`}>
            {soilAssessment.label}
          </span>
        </div>
      </SummaryCard>

      {/* Current sensor readings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map(({ key, label, unit }) => (
          <MetricCard
            key={key}
            label={label}
            value={formatValue(telemetry[key])}
            unit={unit}
          />
        ))}
      </div>

      {/* Active alerts */}
      <SummaryCard title="Active Alerts" className="mb-4">
        {issues.length === 0 ? (
          <p className="text-sm text-green-600 font-medium">All conditions are within normal range.</p>
        ) : (
          <ul className="space-y-2">
            {issues.map((issue, i) => (
              <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-orange-500">•</span>
                {issue}
              </li>
            ))}
          </ul>
        )}
      </SummaryCard>

      <div className="mt-6 flex justify-center">
        <button 
          onClick={handleOpenHistory}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm"
        >
          View Full History Dashboard
        </button>
      </div>
    </div>
  );
}
