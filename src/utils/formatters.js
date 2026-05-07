// formatters.js — pure helper functions for display formatting.
// No React imports here; fully testable in isolation.

/**
 * Format an ISO timestamp into a human-readable "time ago" string.
 * e.g. "3 minutes ago", "just now"
 */
export function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000); // seconds
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

/**
 * Format a Date or ISO string to a short local time string.
 * e.g. "14:32"
 */
export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a Date or ISO string to a readable date.
 * e.g. "7 May 2026"
 */
export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Append a unit label to a numeric value.
 * e.g. formatValue(23.4, '°C') → "23.4 °C"
 */
export function formatValue(value, unit = '') {
  if (value === null || value === undefined) return '—';
  const rounded = typeof value === 'number' ? +value.toFixed(1) : value;
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}
