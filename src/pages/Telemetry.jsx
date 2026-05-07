// Telemetry.jsx — charts page + ThingsBoard integration
import { useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { TB_CONFIG } from '../config/thingsboard';
import SectionTitle from '../components/common/SectionTitle';
import Spinner from '../components/common/Spinner';
import SummaryCard from '../components/cards/SummaryCard';
import TelemetryLineChart from '../components/charts/TelemetryLineChart';
import ThingsBoardEmbed from '../components/telemetry/ThingsBoardEmbed';

// Charts to display — easy to add/remove entries here
const charts = [
  { dataKey: 'temperature',  label: 'Temperature',   unit: '°C', color: '#f97316' },
  { dataKey: 'airHumidity',  label: 'Air Humidity',  unit: '%',  color: '#3b82f6' },
  { dataKey: 'soilMoisture', label: 'Soil Moisture', unit: '%',  color: '#22c55e' },
  { dataKey: 'lightLevel',   label: 'Light Level',   unit: 'lux',color: '#eab308' },
];

export default function Telemetry() {
  const { history, loading, error } = useTelemetry();
  const [activeChart, setActiveChart] = useState('temperature');

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-sm p-4">{error}</p>;

  const selected = charts.find((c) => c.dataKey === activeChart);

  return (
    <div>
      <SectionTitle
        title="Telemetry"
        subtitle="24-hour history of sensor readings"
      />

      {/* Chart selector tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {charts.map(({ dataKey, label }) => (
          <button
            key={dataKey}
            onClick={() => setActiveChart(dataKey)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${activeChart === dataKey
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active chart */}
      {selected && (
        <SummaryCard
          title={`${selected.label} — Last 24 Hours`}
          footer={`Unit: ${selected.unit}`}
          className="mb-6"
        >
          <TelemetryLineChart
            data={history}
            dataKey={selected.dataKey}
            label={selected.label}
            unit={selected.unit}
            color={selected.color}
          />
        </SummaryCard>
      )}

      {/* All charts overview (smaller) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {charts.filter((c) => c.dataKey !== activeChart).map(({ dataKey, label, unit, color }) => (
          <SummaryCard
            key={dataKey}
            title={label}
            footer={`Unit: ${unit}`}
          >
            <TelemetryLineChart
              data={history}
              dataKey={dataKey}
              label={label}
              unit={unit}
              color={color}
            />
          </SummaryCard>
        ))}
      </div>

      {/* ThingsBoard integration */}
      <SectionTitle
        title="ThingsBoard Integration"
        subtitle="Connect to the full telemetry dashboard"
      />
      <ThingsBoardEmbed
        mode={TB_CONFIG.embedMode}
        url={TB_CONFIG.dashboardUrl}
        title="GrowCloud ThingsBoard Dashboard"
      />
    </div>
  );
}
