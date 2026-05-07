// TelemetryLineChart.jsx — reusable Recharts line chart for a single metric over time
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

/**
 * @param {Array}  data       - array of objects with a `time` field + the dataKey field
 * @param {string} dataKey    - which field to plot (e.g. 'temperature')
 * @param {string} label      - human-readable label for the tooltip
 * @param {string} unit       - unit string appended in tooltip (e.g. '°C')
 * @param {string} color      - stroke color (default green)
 */
export default function TelemetryLineChart({
  data,
  dataKey,
  label,
  unit = '',
  color = '#22c55e',
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '13px',
          }}
          formatter={(value) => [`${value}${unit ? ' ' + unit : ''}`, label]}
          labelStyle={{ color: '#6b7280', fontWeight: 500 }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
