// PlantHealth.jsx — detailed health evaluation page
import { useTelemetry } from '../hooks/useTelemetry';
import { evaluateHealth } from '../utils/plantHealth';
import SectionTitle from '../components/common/SectionTitle';
import Spinner from '../components/common/Spinner';
import SummaryCard from '../components/cards/SummaryCard';
import StatusBadge from '../components/cards/StatusBadge';
import GaugeBar from '../components/charts/GaugeBar';

export default function PlantHealth() {
  const { telemetry, loading, error } = useTelemetry();

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-sm p-4">{error}</p>;

  const { status, issues, advice } = evaluateHealth(telemetry);

  const conditionRows = [
    {
      label: 'Soil Moisture',
      value: telemetry.soilMoisture,
      unit: '%',
      colorClass: telemetry.soilMoisture > 30 ? 'bg-green-400' : 'bg-orange-400',
      note: telemetry.soilMoisture > 30 ? 'Adequate' : 'Low',
    },
    {
      label: 'Air Humidity',
      value: telemetry.airHumidity,
      unit: '%',
      colorClass:
        telemetry.airHumidity >= 40 && telemetry.airHumidity <= 80
          ? 'bg-green-400'
          : 'bg-yellow-400',
      note:
        telemetry.airHumidity < 40 ? 'Too Low' :
        telemetry.airHumidity > 80 ? 'Too High' : 'Good',
    },
    {
      label: 'Temperature',
      value: telemetry.temperature,
      max: 40,
      unit: '°C',
      colorClass:
        telemetry.temperature >= 15 && telemetry.temperature <= 32
          ? 'bg-green-400'
          : 'bg-red-400',
      note:
        telemetry.temperature < 15 ? 'Too Cold' :
        telemetry.temperature > 32 ? 'Too Hot' : 'Comfortable',
    },
    {
      label: 'Light Level',
      value: Math.min(telemetry.lightLevel, 1000),
      max: 1000,
      unit: ' lux',
      colorClass: telemetry.lightLevel >= 100 ? 'bg-yellow-400' : 'bg-purple-400',
      note: telemetry.lightLevel >= 100 ? 'Sufficient' : 'Low',
    },
    {
      label: 'Battery',
      value: telemetry.batteryPercent,
      unit: '%',
      colorClass: telemetry.batteryPercent > 25 ? 'bg-green-400' : 'bg-red-400',
      note: telemetry.batteryPercent > 25 ? 'OK' : 'Low',
    },
  ];

  return (
    <div>
      <SectionTitle
        title="Plant Health"
        subtitle="Detailed breakdown of current plant conditions"
      />

      {/* Overall status */}
      <SummaryCard className="mb-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{status === 'Healthy' ? '🌿' : '⚠️'}</span>
          <div>
            <p className="text-sm text-gray-500 mb-1">Overall Status</p>
            <StatusBadge status={status} />
          </div>
        </div>
      </SummaryCard>

      {/* Condition gauges */}
      <SummaryCard title="Condition Overview" className="mb-6">
        <div className="space-y-5">
          {conditionRows.map(({ label, value, max = 100, unit, colorClass, note }) => (
            <div key={label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{value}{unit}</span>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {note}
                  </span>
                </div>
              </div>
              <GaugeBar value={value} max={max} colorClass={colorClass} />
            </div>
          ))}
        </div>
      </SummaryCard>

      {/* Issues & advice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard title="Detected Issues">
          {issues.length === 0 ? (
            <p className="text-sm text-green-600">✓ No issues detected.</p>
          ) : (
            <ul className="space-y-2">
              {issues.map((issue, i) => (
                <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span> {issue}
                </li>
              ))}
            </ul>
          )}
        </SummaryCard>

        <SummaryCard title="Recommendations">
          {advice.length === 0 ? (
            <p className="text-sm text-gray-500">No action needed at this time.</p>
          ) : (
            <ul className="space-y-2">
              {advice.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 text-green-500">→</span> {tip}
                </li>
              ))}
            </ul>
          )}
        </SummaryCard>
      </div>
    </div>
  );
}
