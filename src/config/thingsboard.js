// thingsboard.js — central configuration for ThingsBoard integration.
//
// To switch from mock data to real ThingsBoard telemetry:
//   1. Set USE_MOCK to false
//   2. Fill in serverUrl and deviceToken
//   3. Optionally add your dashboardUrl for the Telemetry page embed
//
// Nothing else in the app needs to change.

export const TB_CONFIG = {
  // ── Mode switch ────────────────────────────────────────────────────────────
  // true  → use local mock data (default, works offline)
  // false → fetch real telemetry from ThingsBoard
  USE_MOCK: true,

  // ── ThingsBoard connection ─────────────────────────────────────────────────
  // Your ThingsBoard server base URL (no trailing slash)
  // Example: 'https://thingsboard.cloud'
  serverUrl: '',

  // Device access token from ThingsBoard → Device → Manage credentials
  deviceToken: '',

  // ── Dashboard embed ────────────────────────────────────────────────────────
  // Public dashboard URL for the Telemetry page integration section.
  // Leave empty to show the "not configured" placeholder.
  // Example: 'https://thingsboard.cloud/dashboard/PUBLIC_ID?publicId=PUBLIC_ID'
  dashboardUrl: '',

  // 'link' → show a button that opens ThingsBoard in a new tab (recommended)
  // 'embed' → embed the dashboard in an iframe directly on the page
  embedMode: 'link',
};
