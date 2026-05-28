// telemetryService.js
// Data access layer — all data fetching goes through here.
//
// Mode is controlled by TB_CONFIG.USE_MOCK in src/config/thingsboard.js:
//   true  → returns local mock data (current default)
//   false → fetches real telemetry from ThingsBoard REST API
//
// No other file needs to change when switching modes.

import { TB_CONFIG } from '../config/thingsboard';
import { latestTelemetry, historicalData, plantInfo } from '../data/mockData';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the most recent telemetry snapshot.
 * @returns {Promise<object>}
 */
export async function fetchLatestTelemetry() {
  if (TB_CONFIG.USE_MOCK) return mockDelay(latestTelemetry);
  return tbFetchLatest();
}

/**
 * Returns historical telemetry for charting.
 * @returns {Promise<Array>}
 */
export async function fetchHistoricalData() {
  if (TB_CONFIG.USE_MOCK) return mockDelay(historicalData);
  return tbFetchHistory();
}

/**
 * Returns static plant/device information.
 * @returns {Promise<object>}
 */
export async function fetchPlantInfo() {
  if (TB_CONFIG.USE_MOCK) return mockDelay(plantInfo);
  return tbFetchPlantInfo();
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function mockDelay(data, ms = 300) {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

// ─── ThingsBoard API stubs ────────────────────────────────────────────────────
// Replace each function body with a real ThingsBoard REST call.
// Docs: https://thingsboard.io/docs/reference/rest-api/
//
// The device access token is available at TB_CONFIG.deviceToken.
// The server base URL is at TB_CONFIG.serverUrl.

async function tbFetchLatest() {
  // [PENDING VERIFICATION]
  // TODO: Verify exact ThingsBoard endpoint for reading telemetry.
  // TODO: Verify exact keys sent by ESP32 and response shape.
  console.warn('Live telemetry fetch logic pending verification. Falling back to mock data.');
  return mockDelay(latestTelemetry);
}

async function tbFetchHistory() {
  // [PENDING VERIFICATION]
  // TODO: Verify exact ThingsBoard endpoint for history/timeseries.
  console.warn('Live history fetch logic pending verification. Falling back to mock data.');
  return mockDelay(historicalData);
}

async function tbFetchPlantInfo() {
  // [PENDING VERIFICATION]
  // TODO: Verify exact ThingsBoard endpoint for device info/attributes.
  console.warn('Live plant info fetch logic pending verification. Falling back to mock data.');
  return mockDelay(plantInfo);
}

