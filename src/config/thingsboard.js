// thingsboard.js — central configuration for ThingsBoard integration.
//
// Live telemetry is fetched server-side by the serverless proxy
// (api/telemetry/latest.js); the browser never talks to ThingsBoard directly.
// USE_MOCK switches the app between local mock data and the live proxy.

export const TB_CONFIG = {
  // ── Mode switch ────────────────────────────────────────────────────────────
  // Mock data is allowed ONLY during local development, and only when explicitly
  // requested with VITE_USE_MOCK_DATA=true. Any production build always uses the
  // live serverless proxy, so the deployed app can never fall back to mock data.
  USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === 'true',

  // ── Dashboard embed ────────────────────────────────────────────────────────
  // Public ThingsBoard dashboard, opened from the Overview/Telemetry page. This
  // is a shareable public link (publicId), not a credential, so it is kept in
  // source as the single place the URL is defined.
  dashboardUrl: 'https://eu.thingsboard.cloud/dashboard/45f3fa20-555e-11f1-be5a-b9befc3a4888?publicId=1eb36ba0-539a-11f1-be5a-b9befc3a4888',

  // 'link'  → open ThingsBoard in a new tab (recommended)
  // 'embed' → embed the dashboard in an iframe on the page
  embedMode: 'link',
};
