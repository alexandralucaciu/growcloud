// Overview.jsx — main dashboard page showing latest plant state
import { useTelemetry } from '../hooks/useTelemetry';
import { evaluateHealth, getWateringRecommendation } from '../utils/plantHealth';
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

export default function Overview() {
  const { telemetry, plantInfo, loading, error } = useTelemetry();

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-sm p-4">{error}</p>;

  const { status, issues } = evaluateHealth(telemetry);
  const wateringNote = getWateringRecommendation(telemetry);

  return (
    <div>
      <SectionTitle
        title={plantInfo?.name ?? 'My Plant'}
        subtitle={`${plantInfo?.location} · Last updated ${timeAgo(telemetry.timestamp)}`}
      />

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <StatusBadge status={status} />
        <span className="text-sm text-gray-500">{wateringNote}</span>
      </div>

      {/* Metric cards */}
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

      {/* Battery + issues row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard title="Battery Level">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-2xl">🔋</span>
            <span className="text-2xl font-bold text-green-900">{telemetry.batteryPercent}%</span>
          </div>
          <GaugeBar
            value={telemetry.batteryPercent}
            colorClass={telemetry.batteryPercent > 25 ? 'bg-green-400' : 'bg-red-400'}
          />
        </SummaryCard>

        <SummaryCard title="Active Alerts">
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
      </div>
    </div>
  );
}
