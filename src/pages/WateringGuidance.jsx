// WateringGuidance.jsx — detailed watering advice with ML placeholder
import { useTelemetry } from '../hooks/useTelemetry';
import { getDetailedWateringAdvice } from '../utils/wateringLogic';
import SectionTitle from '../components/common/SectionTitle';
import Spinner from '../components/common/Spinner';
import SummaryCard from '../components/cards/SummaryCard';

// Urgency colour mapping
const urgencyStyles = {
  ok:   { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800',  icon: '💧' },
  soon: { bg: 'bg-yellow-50', border: 'border-yellow-200',text: 'text-yellow-800', icon: '⚠️' },
  now:  { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',    icon: '🚨' },
};

export default function WateringGuidance() {
  const { telemetry, loading, error } = useTelemetry();

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-sm p-4">{error}</p>;

  const { urgency, title, body, tips } = getDetailedWateringAdvice(telemetry);
  const style = urgencyStyles[urgency];

  return (
    <div>
      <SectionTitle
        title="Watering Guidance"
        subtitle="Based on current soil moisture and environmental conditions"
      />

      {/* Main recommendation card */}
      <div className={`rounded-2xl border-2 ${style.border} ${style.bg} p-6 mb-6 flex items-start gap-4`}>
        <span className="text-3xl shrink-0">{style.icon}</span>
        <div>
          <h2 className={`text-lg font-bold mb-1 ${style.text}`}>{title}</h2>
          <p className="text-sm text-gray-700">{body}</p>
        </div>
      </div>

      {/* Current readings context */}
      <SummaryCard title="Current Readings" className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat label="Soil Moisture" value={`${telemetry.soilMoisture}%`} />
          <Stat label="Temperature"  value={`${telemetry.temperature}°C`} />
          <Stat label="Air Humidity" value={`${telemetry.airHumidity}%`} />
        </div>
      </SummaryCard>

      {/* Contextual tips */}
      <SummaryCard title="Watering Tips" className="mb-6">
        <ul className="space-y-3">
          {tips.map((tip, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-green-500 shrink-0 mt-0.5">→</span>
              {tip}
            </li>
          ))}
        </ul>
      </SummaryCard>

      {/* ML placeholder section */}
      <SummaryCard title="Predictive Watering (Coming Soon)">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="text-3xl">🤖</span>
          <p className="text-sm font-medium text-gray-700">
            ML-based watering prediction is planned for a future version.
          </p>
          <p className="text-xs text-gray-400 max-w-md">
            A trained model will analyse historical soil moisture trends, temperature patterns,
            and seasonal data to predict exactly when the plant needs water — before it shows stress.
            The data layer is already structured to support this.
          </p>
        </div>
      </SummaryCard>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center py-2">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-green-900">{value}</p>
    </div>
  );
}
