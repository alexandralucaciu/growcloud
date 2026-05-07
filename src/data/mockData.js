// Mock telemetry data simulating an ESP32-S2 GrowCloud device.
// Replace this file's exports with real ThingsBoard API calls when ready.

// Latest telemetry snapshot (most recent reading)
export const latestTelemetry = {
  deviceId: 'GC-ESP32-001',
  temperature: 23.4,      // °C
  airHumidity: 58,        // %
  soilMoisture: 28,       // % (lower = drier)
  lightLevel: 420,        // lux
  batteryVoltage: 3.86,   // V  (derived: 3.0 + percent/100 * 1.2)
  batteryPercent: 72,     // %
  timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), // 4 minutes ago
};

// Plant meta-information
export const plantInfo = {
  name: 'Monstera Deliciosa',
  location: 'Living Room',
  deviceId: 'GC-ESP32-001',
  addedDate: '2025-11-01',
};

// Historical telemetry — last 24 hours, one reading per hour (matches ESP32 deep-sleep interval)
// batteryVoltage derived from batteryPercent: 3.0 + (percent / 100) * 1.2  (3.0V min, 4.2V max)
export const historicalData = [
  { time: '00:00', temperature: 20.1, airHumidity: 62, soilMoisture: 45, lightLevel: 5,   batteryPercent: 79, batteryVoltage: 3.95 },
  { time: '01:00', temperature: 19.9, airHumidity: 63, soilMoisture: 44, lightLevel: 4,   batteryPercent: 79, batteryVoltage: 3.95 },
  { time: '02:00', temperature: 19.8, airHumidity: 63, soilMoisture: 43, lightLevel: 3,   batteryPercent: 79, batteryVoltage: 3.95 },
  { time: '03:00', temperature: 19.6, airHumidity: 64, soilMoisture: 42, lightLevel: 2,   batteryPercent: 78, batteryVoltage: 3.94 },
  { time: '04:00', temperature: 19.5, airHumidity: 65, soilMoisture: 41, lightLevel: 2,   batteryPercent: 78, batteryVoltage: 3.94 },
  { time: '05:00', temperature: 19.7, airHumidity: 65, soilMoisture: 40, lightLevel: 3,   batteryPercent: 78, batteryVoltage: 3.94 },
  { time: '06:00', temperature: 20.3, airHumidity: 64, soilMoisture: 39, lightLevel: 80,  batteryPercent: 78, batteryVoltage: 3.94 },
  { time: '07:00', temperature: 21.0, airHumidity: 62, soilMoisture: 38, lightLevel: 190, batteryPercent: 77, batteryVoltage: 3.92 },
  { time: '08:00', temperature: 21.7, airHumidity: 61, soilMoisture: 37, lightLevel: 310, batteryPercent: 77, batteryVoltage: 3.92 },
  { time: '09:00', temperature: 22.4, airHumidity: 60, soilMoisture: 36, lightLevel: 430, batteryPercent: 77, batteryVoltage: 3.92 },
  { time: '10:00', temperature: 23.0, airHumidity: 59, soilMoisture: 35, lightLevel: 520, batteryPercent: 76, batteryVoltage: 3.91 },
  { time: '11:00', temperature: 23.8, airHumidity: 57, soilMoisture: 34, lightLevel: 610, batteryPercent: 76, batteryVoltage: 3.91 },
  { time: '12:00', temperature: 24.5, airHumidity: 56, soilMoisture: 32, lightLevel: 680, batteryPercent: 75, batteryVoltage: 3.90 },
  { time: '13:00', temperature: 24.9, airHumidity: 55, soilMoisture: 31, lightLevel: 640, batteryPercent: 75, batteryVoltage: 3.90 },
  { time: '14:00', temperature: 25.1, airHumidity: 54, soilMoisture: 30, lightLevel: 590, batteryPercent: 74, batteryVoltage: 3.89 },
  { time: '15:00', temperature: 24.8, airHumidity: 55, soilMoisture: 30, lightLevel: 520, batteryPercent: 74, batteryVoltage: 3.89 },
  { time: '16:00', temperature: 24.2, airHumidity: 56, soilMoisture: 29, lightLevel: 450, batteryPercent: 74, batteryVoltage: 3.89 },
  { time: '17:00', temperature: 23.6, airHumidity: 57, soilMoisture: 29, lightLevel: 320, batteryPercent: 73, batteryVoltage: 3.88 },
  { time: '18:00', temperature: 23.1, airHumidity: 57, soilMoisture: 28, lightLevel: 180, batteryPercent: 73, batteryVoltage: 3.88 },
  { time: '19:00', temperature: 22.8, airHumidity: 58, soilMoisture: 28, lightLevel: 90,  batteryPercent: 73, batteryVoltage: 3.88 },
  { time: '20:00', temperature: 22.4, airHumidity: 58, soilMoisture: 28, lightLevel: 30,  batteryPercent: 73, batteryVoltage: 3.88 },
  { time: '21:00', temperature: 22.1, airHumidity: 59, soilMoisture: 28, lightLevel: 15,  batteryPercent: 72, batteryVoltage: 3.86 },
  { time: '22:00', temperature: 21.8, airHumidity: 59, soilMoisture: 28, lightLevel: 8,   batteryPercent: 72, batteryVoltage: 3.86 },
  { time: '23:00', temperature: 21.5, airHumidity: 60, soilMoisture: 28, lightLevel: 5,   batteryPercent: 72, batteryVoltage: 3.86 },
];
