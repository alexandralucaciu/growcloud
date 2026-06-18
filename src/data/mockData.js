// Mock telemetry data simulating an ESP32-S2 GrowCloud device.
// Replace this file's exports with real ThingsBoard API calls when ready.

// Latest telemetry snapshot (most recent reading)
export const latestTelemetry = {
  deviceId: 'GC-ESP32-001',
  temperature: 23.4,      // °C
  airHumidity: 58,        // %
  soilMoisture: 28,       // % (lower = drier)
  lightLevel: 420,        // lux
  timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), // 4 minutes ago
};

// Plant meta-information
export const plantInfo = {
  name: 'Spathiphyllum (Peace Lily)',
  location: 'Living Room',
  deviceId: 'GC-ESP32-001',
  addedDate: '2025-11-01',
};

