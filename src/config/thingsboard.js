// thingsboard.js — central configuration for ThingsBoard integration.
//
// Live telemetry is fetched server-side by the serverless proxy
//  (api/telemetry/latest.js); 
//   USE_MOCK switches the app between local mock data the live proxy
//
// Nothing else in the app needs to change.

export const TB_CONFIG = {
  // ── Mode switch ────────────────────────────────────────────────────────────
  // true  → use local mock data (default, works offline)
  // false → fetch real telemetry from ThingsBoard
  USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === 'true',

  // ── ThingsBoard connection ─────────────────────────────────────────────────
  // Your ThingsBoard server base URL (no trailing slash)
  // Example: 'https://thingsboard.cloud'
  serverUrl: import.meta.env.VITE_THINGSBOARD_SERVER_URL || '',

  // Device access token from ThingsBoard → Device → Manage credentials
  deviceToken: import.meta.env.VITE_THINGSBOARD_DEVICE_TOKEN || '',

  // ── Dashboard embed ────────────────────────────────────────────────────────
  // Public dashboard URL for the Telemetry page integration section.
  // Leave empty to show the "not configured" placeholder.
  // Example: 'https://thingsboard.cloud/dashboard/PUBLIC_ID?publicId=PUBLIC_ID'
 
  dashboardUrl: 'https://eu.thingsboard.cloud/dashboard/45f3fa20-555e-11f1-be5a-b9befc3a4888?publicId=1eb36ba0-539a-11f1-be5a-b9befc3a4888',
  // 'link' → show a button that opens ThingsBoard in a new tab (recommended)
  // 'embed' → embed the dashboard in an iframe directly on the page
  embedMode: 'link',
};
