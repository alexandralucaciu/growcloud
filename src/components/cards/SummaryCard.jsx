// SummaryCard.jsx — a larger info card with optional title and footer slot
export default function SummaryCard({ title, children, footer, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          {footer}
        </div>
      )}
    </div>
  );
}
