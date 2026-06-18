// DataSourceBadge.jsx — makes the origin of the displayed data visible at all
// times. In live mode it shows that the values come from the physical device,
// together with the timestamp of the last real reading received from
// ThingsBoard. In mock mode (development only) it shows an unmistakable warning,
// so simulated data can never be mistaken for real telemetry.
import { useTelemetry } from '../../hooks/useTelemetry';
import { TB_CONFIG } from '../../config/thingsboard';
import { timeAgo } from '../../utils/formatters';

export default function DataSourceBadge() {
  const { telemetry } = useTelemetry();

  if (TB_CONFIG.USE_MOCK) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
        MOCK DATA — development only
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      Live data from device
      {telemetry?.timestamp && (
        <span className="text-green-700">· last reading {timeAgo(telemetry.timestamp)}</span>
      )}
    </span>
  );
}
