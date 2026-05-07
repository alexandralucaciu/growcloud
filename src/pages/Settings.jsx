// Settings.jsx — device info and project about page
import SectionTitle from '../components/common/SectionTitle';
import SummaryCard from '../components/cards/SummaryCard';

const deviceInfo = [
  { label: 'Device',       value: 'ESP32-S2 Mini' },
  { label: 'Device ID',    value: 'GC-ESP32-001' },
  { label: 'Firmware',     value: 'GrowCloud v1.0.0' },
  { label: 'Platform',     value: 'ThingsBoard' },
  { label: 'Added',        value: '1 November 2025' },
];

const sensorInfo = [
  { label: 'Temperature',   value: 'DHT22 (±0.5°C)' },
  { label: 'Air Humidity',  value: 'DHT22 (±2-5%)' },
  { label: 'Soil Moisture', value: 'Capacitive sensor' },
  { label: 'Light Level',   value: 'LDR / BH1750' },
  { label: 'Battery',       value: 'ADC voltage divider' },
];

export default function Settings() {
  return (
    <div>
      <SectionTitle
        title="Settings & About"
        subtitle="Device information and project details"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SummaryCard title="Device Information">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {deviceInfo.map(({ label, value }) => (
                <tr key={label}>
                  <td className="py-2 text-gray-400 font-medium w-36">{label}</td>
                  <td className="py-2 text-gray-800">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SummaryCard>

        <SummaryCard title="Sensors">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {sensorInfo.map(({ label, value }) => (
                <tr key={label}>
                  <td className="py-2 text-gray-400 font-medium w-36">{label}</td>
                  <td className="py-2 text-gray-800">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SummaryCard>
      </div>

      {/* About */}
      <SummaryCard title="About GrowCloud" className="mb-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl shrink-0">🌱</span>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>GrowCloud</strong> is a smart plant monitoring system built as a university
              licence project. It uses an ESP32-S2 Mini microcontroller equipped with environmental
              sensors to monitor a plant's condition remotely.
            </p>
            <p>
              Data is transmitted to <strong>ThingsBoard</strong> for storage and visualisation.
              This companion web application provides a user-friendly view of the plant's current
              status, health, and watering needs.
            </p>
            <p>
              Future versions will include machine-learning based watering predictions trained on
              historical sensor data.
            </p>
          </div>
        </div>
      </SummaryCard>

      {/* Placeholder settings */}
      <SummaryCard title="App Settings (Planned)">
        <div className="space-y-4 text-sm text-gray-500">
          <SettingRow label="ThingsBoard Dashboard URL" placeholder="https://thingsboard.io/dashboards/..." />
          <SettingRow label="Plant Name" placeholder="e.g. Monstera Deliciosa" />
          <SettingRow label="Soil Moisture Alert Threshold" placeholder="e.g. 30%" />
          <p className="text-xs text-gray-400 pt-2">
            Settings persistence will be added in a future update (localStorage or backend).
          </p>
        </div>
      </SummaryCard>
    </div>
  );
}

function SettingRow({ label, placeholder }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <label className="w-56 text-gray-600 font-medium shrink-0">{label}</label>
      <input
        type="text"
        disabled
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-400
          text-sm cursor-not-allowed"
      />
    </div>
  );
}
