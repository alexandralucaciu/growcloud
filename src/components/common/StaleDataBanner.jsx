// StaleDataBanner.jsx — shown when the last telemetry reading is older than the
// stale threshold (90 min). Self-contained: calls useTelemetry internally so it
// can be dropped into the layout without prop drilling.
import { useTelemetry } from '../../hooks/useTelemetry';
import { timeAgo } from '../../utils/formatters';

export default function StaleDataBanner() {
  const { telemetry, isStale } = useTelemetry();

  if (!isStale) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
      <span className="shrink-0 text-base">⚠️</span>
      <span>
        <strong>Data may be outdated.</strong> Last reading received{' '}
        {telemetry ? timeAgo(telemetry.timestamp) : 'a while ago'}.
        The device may be offline or in deep sleep.
      </span>
    </div>
  );
}
