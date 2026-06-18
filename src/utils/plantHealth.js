// plantHealth.js — rule-based plant health evaluation.
// Returns structured health data that can later be replaced or supplemented
// by an ML model output with the same shape.

import { isNightModeNow } from '../hooks/useNightMode';

const ROOT_ROT_ALERT = '🚨 CRITICAL WARNING: Soil Over-saturation Detected! The soil moisture has been at 100% for the past 24 hours continuously. Your Spathiphyllum is at high risk of root rot due to oxygen deprivation (asfixiere radiculară). Please stop watering immediately and ensure proper pot drainage.';

/**
 * Thresholds that define healthy ranges for each metric.
 * Adjust these to match the specific plant species.
 */
const THRESHOLDS = {
  soilMoisture: { critical: 35, warning: 50, caution: 70, idealLow: 70, idealHigh: 85, saturation: 95 },
  temperature:  { low: 15, high: 32 },        // °C
  airHumidity:  { low: 40, high: 80 },        // %
  lightLevel:   { low: 100 },                 // lux — below this is low light
};

function makeAssessment({
  severity,
  label,
  note,
  issue = '',
  advice = '',
  colorClass,
  borderClass,
}) {
  return { severity, label, note, issue, advice, colorClass, borderClass };
}

export function getSoilMoistureAssessment(soilMoisture, overSaturated24h = false) {

  if (soilMoisture === 100 && overSaturated24h) {
    return makeAssessment({
      severity: 'critical_over_saturated',
      colorClass: 'bg-red-600 text-white',
      borderClass: 'border-red-200',
      label: 'Over-saturated / Risk of Root Rot',
      note: '24h at 100%',
      issue: ROOT_ROT_ALERT,
      advice: 'Stop watering immediately and ensure proper pot drainage.',
    });
  }

  if (soilMoisture >= 95 && overSaturated24h) {
    return makeAssessment({
      severity: 'wet',
      colorClass: 'bg-red-400 text-white',
      borderClass: 'border-red-100',
      label: 'Near Saturation',
      note: 'Persisting too long',
      issue: 'Soil moisture has stayed in the near-saturation range for 24 hours.',
      advice: 'Avoid watering and verify drainage before the next irrigation cycle.',
    });
  }

  if (soilMoisture < THRESHOLDS.soilMoisture.critical) {
    return makeAssessment({
      severity: 'critical',
      colorClass: 'bg-red-500 text-white',
      borderClass: 'border-red-200',
      label: 'Critical',
      note: 'Too dry',
      issue: 'Soil moisture is critically low — water the plant now.',
      advice: 'Water immediately and check that the pot drains properly.',
    });
  }

  if (soilMoisture < THRESHOLDS.soilMoisture.warning) {
    return makeAssessment({
      severity: 'warning',
      colorClass: 'bg-orange-400 text-white',
      borderClass: 'border-orange-200',
      label: 'Warning',
      note: 'Under 50%',
      issue: 'Soil moisture is below the healthy range.',
      advice: 'Water the plant soon and recheck moisture within a few hours.',
    });
  }

  if (soilMoisture < THRESHOLDS.soilMoisture.caution) {
    return makeAssessment({
      severity: 'caution',
      colorClass: 'bg-yellow-400 text-gray-900',
      borderClass: 'border-yellow-200',
      label: 'Sub-optimal',
      note: 'Not good, not that bad',
      issue: 'Soil moisture is acceptable but still below the preferred range.',
      advice: 'Monitor moisture more closely and plan watering if the trend keeps dropping.',
    });
  }

  if (soilMoisture <= THRESHOLDS.soilMoisture.idealHigh) {
    return makeAssessment({
      severity: 'perfect',
      colorClass: 'bg-green-400 text-white',
      borderClass: 'border-green-200',
      label: 'Perfect',
      note: 'Ideal range',
    });
  }

  if (soilMoisture < THRESHOLDS.soilMoisture.saturation) {
    return makeAssessment({
      severity: 'wet',
      colorClass: 'bg-sky-400 text-white',
      borderClass: 'border-sky-200',
      label: 'Moist',
      note: 'Above ideal',
      issue: 'Soil moisture is above the ideal range.',
      advice: 'Avoid watering for now and keep monitoring the trend.',
    });
  }

  return makeAssessment({
    severity: overSaturated24h ? 'critical' : 'wet',
    colorClass: overSaturated24h ? 'bg-red-500 text-white' : 'bg-sky-400 text-white',
    borderClass: overSaturated24h ? 'border-red-200' : 'border-sky-200',
    label: overSaturated24h ? 'Critical' : 'Very Wet',
    note: overSaturated24h ? 'Over 24h' : 'Monitor closely',
    issue: overSaturated24h
      ? 'Soil moisture has stayed above 90% for more than 24 hours.'
      : '',
    advice: overSaturated24h
      ? 'Hold watering and inspect drainage and root health.'
      : 'Do not water yet and recheck later today.',
  });
}

/**
 * Evaluate the plant's health based on a telemetry snapshot.
 *
 * @param {object} telemetry - latest telemetry values
 * @param {{ isNightMode?: boolean }} [options]
 * @returns {{ status: string, issues: string[], advice: string[] }}
 */
export function evaluateHealth(telemetry, options = {}) {
  const issues = [];
  const advice = [];
  const isNightMode = options.isNightMode ?? isNightModeNow();

  const { soilMoisture, temperature, airHumidity, lightLevel, batteryPercent } = telemetry;
  const soilAssessment = getSoilMoistureAssessment(soilMoisture, telemetry.soilOverSaturated24h);

  // --- Soil moisture ---
  if (soilAssessment.issue) {
    issues.push(soilAssessment.issue);
  }
  if (soilAssessment.advice) {
    advice.push(soilAssessment.advice);
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
  if (!isNightMode && lightLevel < THRESHOLDS.lightLevel.low) {
    issues.push(`Light level is low (${lightLevel} lux).`);
    advice.push('Move the plant closer to a window or add a grow light.');
  }

  // --- Overall status ---
  let status = 'Healthy';
  const hasUrgent = telemetry.soilMoisture < THRESHOLDS.soilMoisture.critical;

  if (soilAssessment.severity === 'critical_over_saturated') {
    status = 'Over-saturated / Risk of Root Rot';
  } else if (soilAssessment.severity === 'critical') {
    status = 'Needs Attention';
  }

  if (soilAssessment.severity !== 'critical_over_saturated' && hasUrgent) {
    status = 'Needs Attention';
  } else if (issues.length > 0) {
    status = 'Attention';
  }

  return { status, issues, advice, soilAssessment };
}

/**
 * Generate a watering recommendation based on soil moisture and conditions.
 * Returns a plain-language string suitable for display.
 *
 * @param {object} telemetry
 * @returns {string}
 */
export function getWateringRecommendation(telemetry) {
  const soilAssessment = getSoilMoistureAssessment(telemetry.soilMoisture, telemetry.soilOverSaturated24h);

  if (soilAssessment.severity === 'critical_over_saturated') {
    return 'Stop watering immediately and fix drainage before resuming.';
  }
  if (soilAssessment.severity === 'critical') {
    return 'Water now — soil is critically dry.';
  }
  if (soilAssessment.severity === 'warning') {
    return 'Water soon — soil moisture is below the healthy range.';
  }
  if (soilAssessment.severity === 'caution') {
    return 'Soil is acceptable but sub-optimal. Monitor closely.';
  }
  if (soilAssessment.severity === 'perfect') {
    return 'Soil moisture is in the ideal range.';
  }
  return 'Soil is moist. Avoid watering for now.';
}
