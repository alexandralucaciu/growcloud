// wateringLogic.js — dedicated watering advice logic.
// Separated from plantHealth.js so it can be extended with ML predictions later.
// An ML model would simply replace or supplement getDetailedWateringAdvice().

import { getSoilMoistureAssessment } from './plantHealth';

/**
 * Returns a detailed watering guidance object.
 *
 * @param {object} telemetry - latest telemetry snapshot
 * @returns {{ urgency: string, title: string, body: string, tips: string[] }}
 */
export function getDetailedWateringAdvice(telemetry) {
  const { soilMoisture, temperature, airHumidity } = telemetry;
  const soilAssessment = getSoilMoistureAssessment(soilMoisture, telemetry.soilOverSaturated24h);

  // Urgency levels: 'ok' | 'soon' | 'now'
  let urgency;
  let title;
  let body;
  const tips = [];

  if (soilAssessment.severity === 'critical_over_saturated') {
    urgency = 'now';
    title = 'Over-saturated / Risk of Root Rot';
    body = 'Soil moisture has been at 100% for 24 hours. Stop watering immediately and fix drainage.';
  } else if (soilAssessment.severity === 'critical') {
    urgency = 'now';
    title = soilMoisture > 90 ? 'Too Wet for Now' : 'Water Immediately';
    body = soilMoisture > 90
      ? 'The soil has stayed excessively wet. Pause watering and let the root zone recover.'
      : 'The soil is critically dry. Delay will stress the plant and may cause leaf wilting or browning.';
  } else if (soilAssessment.severity === 'warning') {
    urgency = 'soon';
    title = 'Water Soon';
    body = 'Soil moisture is below the recommended level. Water the plant in the next 24 hours.';
  } else if (soilAssessment.severity === 'caution') {
    urgency = 'ok';
    title = 'Monitor Moisture';
    body = 'Soil moisture is below the ideal range but not yet critical. Check again soon.';
  } else {
    urgency = 'ok';
    title = soilAssessment.severity === 'wet' ? 'Very Moist' : 'Well Hydrated';
    body = soilAssessment.severity === 'wet'
      ? 'The soil is above the ideal range. Hold off on watering and keep monitoring it.'
      : 'The plant has plenty of moisture. No watering needed right now.';
  }

  // Contextual tips based on other conditions
  if (temperature > 28) {
    tips.push('High temperature increases evaporation — you may need to water more frequently.');
  }
  if (airHumidity < 40) {
    tips.push('Low air humidity causes faster leaf transpiration. Consider misting the leaves.');
  }
  if (airHumidity > 75) {
    tips.push('High humidity slows moisture loss — be careful not to overwater.');
  }
  tips.push('Always water at the base of the plant, not on the leaves.');
  tips.push('Ensure the pot has drainage holes to prevent root rot.');

  return { urgency, title, body, tips };
}
