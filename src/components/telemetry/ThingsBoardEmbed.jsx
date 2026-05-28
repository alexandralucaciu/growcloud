// ThingsBoardEmbed.jsx — reusable component for ThingsBoard dashboard integration.
// Supports two modes:
//   'embed'  — renders an iframe with the dashboard URL
//   'link'   — renders a styled link/button to open the dashboard externally

/**
 * @param {string} mode     - 'embed' or 'link'
 * @param {string} url      - ThingsBoard public dashboard URL
 * @param {string} title    - optional title shown above the embed/link
 */
export default function ThingsBoardEmbed({ mode = 'link', url, title = 'ThingsBoard Dashboard' }) {
  if (!url) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-400 text-sm font-medium mb-1">No ThingsBoard URL configured</p>
        <p className="text-gray-300 text-xs">
          Add your dashboard URL in Settings to enable live telemetry integration.
        </p>
      </div>
    );
  }

  if (mode === 'embed') {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        {title && (
          <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">{title}</span>
            <span className="ml-auto text-xs text-gray-400">Live embed</span>
          </div>
        )}
        <iframe
          src={url}
          title={title}
          className="w-full"
          style={{ height: 500, border: 'none' }}
          allowFullScreen
        />
      </div>
    );
  }

  // Default: link mode
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4">
      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Dashboard</div>
      <p className="text-sm font-medium text-gray-700 text-center">{title}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700
          text-white text-sm font-semibold transition-colors shadow-sm"
      >
        Open in ThingsBoard ↗
      </a>
    </div>
  );
}
