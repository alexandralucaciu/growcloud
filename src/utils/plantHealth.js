// plantHealth.js — rule-based plant health evaluation.
// Returns structured health data that can later be replaced or supplemented
// by an ML model output with the same shape.

/**
 * Thresholds that define healthy ranges for each metric.
 * Adjust these to match the specific plant species.
 */
const THRESHOLDS = {
  soilMoisture: { low: 30, critical: 20 },   // % — below low = attention, below critical = needs water
  temperature:  { low: 15, high: 32 },        // °C
  airHumidity:  { low: 40, high: 80 },        // %
  lightLevel:   { low: 100 },                 // lux — below this is low light
  batteryPercent: { low: 25, critical: 10 },  // %
};

/**
 * Evaluate the plant's health based on a telemetry snapshot.
 *
 * @param {object} telemetry - latest telemetry values
 * @returns {{ status: string, issues: string[], advice: string[] }}
 */
export function evaluateHealth(telemetry) {
  const issues = [];
  const advice = [];

  const { soilMoisture, temperature, airHumidity, lightLevel, batteryPercent } = telemetry;

  // --- Soil moisture ---
  if (soilMoisture <= THRESHOLDS.soilMoisture.critical) {
    issues.push('Soil is very dry — plant needs water urgently.');
    advice.push('Water the plant immediately and check for drainage issues.');
  } else if (soilMoisture <= THRESHOLDS.soilMoisture.low) {
    issues.push('Soil moisture is low.');
    advice.push('Consider watering the plant soon.');
  }

  // --- Temperature ---
  if (temperature < THRESHOLDS.temperature.low) {
    issues.push(`Temperature is too low (${temperature}°C).`);
    advice.push('Move the plant to a warmer spot.');
  } else if (temperature > THRESHOLDS.temperature.high) {
    issues.push(`Temperature is too high (${temperature}°C).`);
    advice.push('Move the plant away from direct heat sources.');
  }

  // --- Air humidity ---
  if (airHumidity < THRESHOLDS.airHumidity.low) {
    issues.push(`Air humidity is low (${airHumidity}%).`);
    advice.push('Use a humidifier or mist the leaves occasionally.');
  } else if (airHumidity > THRESHOLDS.airHumidity.high) {
    issues.push(`Air humidity is very high (${airHumidity}%).`);
    advice.push('Improve air circulation to avoid fungal issues.');
  }

  // --- Light ---
  if (lightLevel < THRESHOLDS.lightLevel.low) {
    issues.push(`Light level is low (${lightLevel} lux).`);
    advice.push('Move the plant closer to a window or add a grow light.');
  }

  // --- Battery ---
  if (batteryPercent <= THRESHOLDS.batteryPercent.critical) {
    issues.push(`Device battery critically low (${batteryPercent}%).`);
    advice.push('Charge the GrowCloud device as soon as possible.');
  } else if (batteryPercent <= THRESHOLDS.batteryPercent.low) {
    issues.push(`Device battery is low (${batteryPercent}%).`);
    advice.push('Plan to charge the device soon.');
  }

  // --- Overall status ---
  let status = 'Healthy';
  const hasUrgent = telemetry.soilMoisture <= THRESHOLDS.soilMoisture.critical
    || telemetry.batteryPercent <= THRESHOLDS.batteryPercent.critical;

  if (hasUrgent) {
    status = 'Needs Attention';
  } else if (issues.length > 0) {
    status = 'Attention';
  }

  return { status, issues, advice };
}

/**
 * Generate a watering recommendation based on soil moisture and conditions.
 * Returns a plain-language string suitable for display.
 *
 * @param {object} telemetry
 * @returns {string}
 */
export function getWateringRecommendation(telemetry) {
  const { soilMoisture, temperature } = telemetry;

  if (soilMoisture <= THRESHOLDS.soilMoisture.critical) {
    return 'Water now — soil is critically dry.';
  }
  if (soilMoisture <= THRESHOLDS.soilMoisture.low) {
    return temperature > 28
      ? 'Water today — warm conditions are accelerating moisture loss.'
      : 'Water within the next day or two.';
  }
  if (soilMoisture <= 50) {
    return 'Soil is adequate. Monitor over the next few days.';
  }
  return 'Soil is well-hydrated. No watering needed.';
}
