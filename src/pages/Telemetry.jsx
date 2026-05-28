// Telemetry.jsx — cloud portal for historical telemetry and ThingsBoard access
import { useTelemetry } from '../hooks/useTelemetry';
import { TB_CONFIG } from '../config/thingsboard';
import SectionTitle from '../components/common/SectionTitle';
import Spinner from '../components/common/Spinner';
import SummaryCard from '../components/cards/SummaryCard';
import ThingsBoardEmbed from '../components/telemetry/ThingsBoardEmbed';
import MetricCard from '../components/cards/MetricCard';
import { formatValue, timeAgo } from '../utils/formatters';

const metrics = [
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'airHumidity', label: 'Air Humidity', unit: '%' },
  { key: 'soilMoisture', label: 'Soil Moisture', unit: '%' },
  { key: 'lightLevel', label: 'Light Level', unit: 'lux' },
];

export default function Telemetry() {
  const { telemetry, plantInfo, loading, error } = useTelemetry();

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-sm p-4">{error}</p>;

  return (
    <div>
      <SectionTitle
        title="Telemetry"
        subtitle="Real-time snapshot plus direct access to cloud-based history and analysis"
      />

      <SummaryCard title="Cloud History" className="mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.map(({ key, label, unit }) => (
              <MetricCard
                key={key}
                label={label}
                value={telemetry ? formatValue(telemetry[key]) : '--'}
                unit={unit}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
            <span>Plant: {plantInfo?.name ?? 'My Plant'}</span>
            {telemetry?.timestamp && <span>Last updated {timeAgo(telemetry.timestamp)}</span>}
          </div>
        </div>
      </SummaryCard>

      {/* ThingsBoard integration */}
      <SectionTitle
        title="Full Dashboard"
        subtitle="Open the complete live dashboard in ThingsBoard for historical filtering and analysis"
      />
      <p className="mb-4 text-sm text-gray-700 leading-relaxed">
        For detailed sensor history and advanced time-series analysis, please use the integrated cloud dashboard. Within the ThingsBoard platform, you can filter and display historical logs for any custom interval (e.g., last 1 hour, 24 hours, or specific days) in real time.
      </p>
      <ThingsBoardEmbed
        mode={TB_CONFIG.embedMode}
        url={TB_CONFIG.dashboardUrl}
        title="GrowCloud ThingsBoard Dashboard"
      />
    </div>
  );
}
