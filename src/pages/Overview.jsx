// Overview.jsx — main dashboard page showing latest plant state
import { Link } from 'react-router-dom';
import { useTelemetry } from '../hooks/useTelemetry';
import { evaluateHealth } from '../utils/plantHealth';
import { getDetailedWateringAdvice } from '../utils/wateringLogic';
import { timeAgo, formatValue } from '../utils/formatters';
import SectionTitle from '../components/common/SectionTitle';
import Spinner from '../components/common/Spinner';
import MetricCard from '../components/cards/MetricCard';
import SummaryCard from '../components/cards/SummaryCard';
import StatusBadge from '../components/cards/StatusBadge';
import GaugeBar from '../components/charts/GaugeBar';

const metrics = [
  { key: 'temperature',  label: 'Temperature',   unit: '°C', icon: '🌡️' },
  { key: 'airHumidity',  label: 'Air Humidity',  unit: '%',  icon: '💨' },
  { key: 'soilMoisture', label: 'Soil Moisture', unit: '%',  icon: '🌱' },
  { key: 'lightLevel',   label: 'Light Level',   unit: 'lux',icon: '☀️' },
];

const urgencyStyles = {
  ok:   { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  icon: '💧' },
  soon: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚠️' },
  now:  { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    icon: '🚨' },
};

export default function Overview() {
  const { telemetry, plantInfo, loading, error } = useTelemetry();

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-sm p-4">{error}</p>;

  const { status, issues } = evaluateHealth(telemetry);
  const { urgency, title: waterTitle, body: waterBody } = getDetailedWateringAdvice(telemetry);
  const wStyle = urgencyStyles[urgency];

  const handleOpenHistory = () => { 
    window.open("https://eu.thingsboard.cloud/dashboard/45f3fa20-555e-11f1-be5a-b9befc3a4888?publicId=1eb36ba0-539a-11f1-be5a-b9befc3a4888", "_blank", "noopener,noreferrer"); 
  };

  return (
    <div>
      <SectionTitle
        title={plantInfo?.name ?? 'My Plant'}
        subtitle={`${plantInfo?.location} · Last updated ${timeAgo(telemetry.timestamp)}`}
      />

      {/* Overall plant condition */}
      <div className="flex items-center gap-3 mb-4">
        <StatusBadge status={status} />
        <span className="text-sm text-gray-400">Plant condition</span>
      </div>

      {/* Watering recommendation — primary action */}
      <Link to="/watering" className="block mb-6">
        <div className={`rounded-2xl border-2 ${wStyle.border} ${wStyle.bg} px-5 py-4
          flex items-center gap-4 hover:opacity-90 transition-opacity`}>
          <span className="text-2xl shrink-0">{wStyle.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${wStyle.text}`}>{waterTitle}</p>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">{waterBody}</p>
          </div>
          <span className="text-xs text-gray-400 shrink-0 hidden sm:block">View guidance →</span>
        </div>
      </Link>

      {/* Current sensor readings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map(({ key, label, unit, icon }) => (
          <MetricCard
            key={key}
            label={label}
            value={formatValue(telemetry[key])}
            unit={unit}
            icon={icon}
          />
        ))}
      </div>

      {/* Active alerts */}
      <SummaryCard title="Active Alerts" className="mb-4">
        {issues.length === 0 ? (
          <p className="text-sm text-green-600 font-medium">✓ All conditions are within normal range.</p>
        ) : (
          <ul className="space-y-2">
            {issues.map((issue, i) => (
              <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                <span className="mt-0.5 shrink-0">⚠️</span>
                {issue}
              </li>
            ))}
          </ul>
        )}
      </SummaryCard>

      {/* Device battery — secondary information */}
      <div className="flex items-center gap-2.5 px-1 text-xs text-gray-400">
        <span>🔋</span>
        <span>
          Device battery:{' '}
          <span className={telemetry.batteryPercent <= 25 ? 'text-red-500 font-medium' : ''}>
            {telemetry.batteryPercent}%
          </span>
        </span>
        <div className="w-16">
          <GaugeBar
            value={telemetry.batteryPercent}
            colorClass={telemetry.batteryPercent > 25 ? 'bg-green-300' : 'bg-red-400'}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button 
          onClick={handleOpenHistory}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm"
        >
          View Full History Dashboard 📊
        </button>
      </div>
    </div>
  );
}
