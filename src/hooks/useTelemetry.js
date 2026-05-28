// useTelemetry.js — custom hook that loads telemetry data from the service layer.
// Components use this hook; they never import from services or data directly.
// To switch from mock to real data, update telemetryService.js only.

import { useState, useEffect } from 'react';
import {
  fetchLatestTelemetry,
  fetchHistoricalData,
  fetchPlantInfo,
} from '../services/telemetryService';
import { TB_CONFIG } from '../config/thingsboard';

// Data older than this is considered stale.
// The ESP32 sends one reading per hour (deep sleep). 90 min gives one missed
// cycle of tolerance before alerting the user.
const STALE_THRESHOLD_MS = 90 * 60 * 1000;

/**
 * Loads latest telemetry, history, and plant info.
 * Returns { telemetry, history, plantInfo, isStale, loading, error }
 */
export function useTelemetry() {
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [plantInfo, setPlantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let pollInterval = null;

    async function fetchLiveTelemetry() {
      try {
        const authRes = await fetch("https://eu.thingsboard.cloud/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "api-growcloud@planta.ro",
            password: "API123456"
          })
        });
        if (!authRes.ok) throw new Error("TB Auth Failed");
        const authData = await authRes.json();
        const token = authData.token;

        const tbRes = await fetch("https://eu.thingsboard.cloud/api/plugins/telemetry/DEVICE/2f815460-54fd-11f1-be5a-b9befc3a4888/values/timeseries", {
          headers: { "X-Authorization": `Bearer ${token}` }
        });
        if (!tbRes.ok) throw new Error("TB Telemetry Fetch Failed");
        const tbData = await tbRes.json();

        const temperature = tbData.temperature && tbData.temperature[0] ? tbData.temperature[0].value : '--';
        const airHumidity = tbData.humidity && tbData.humidity[0] ? tbData.humidity[0].value : '--';
        const soilMoisture = tbData.soil && tbData.soil[0] ? tbData.soil[0].value : '--';
        const lightLevel = tbData.light && tbData.light[0] ? tbData.light[0].value : '--';
        const batteryPercent = tbData.battery && tbData.battery[0] ? tbData.battery[0].value : '100';

        if (!cancelled) {
          setTelemetry({
            deviceId: "2f815460-54fd-11f1-be5a-b9befc3a4888",
            temperature,
            airHumidity,
            soilMoisture,
            lightLevel,
            batteryPercent,
            timestamp: tbData.temperature && tbData.temperature[0] ? new Date(tbData.temperature[0].ts).toISOString() : new Date().toISOString()
          });
          setError(null);
        }
      } catch (err) {
        console.error("Live fetch error:", err);
        if (!cancelled) setError(err.message || 'Failed to load live data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function load() {
      try {
        setLoading(true);
        // Load static/history first
        const [h, p] = await Promise.all([
          fetchHistoricalData(),
          fetchPlantInfo()
        ]);
        if (!cancelled) {
          setHistory(h);
          setPlantInfo(p);
        }

        // Branch between Live polling or Mock delay
        if (TB_CONFIG.USE_MOCK) {
          const t = await fetchLatestTelemetry();
          if (!cancelled) {
            setTelemetry(t);
            setError(null);
            setLoading(false);
          }
        } else {
          await fetchLiveTelemetry();
          // Poll every 20 seconds
          pollInterval = setInterval(fetchLiveTelemetry, 20000);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { 
      cancelled = true; 
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const isStale = telemetry
    ? Date.now() - new Date(telemetry.timestamp).getTime() > STALE_THRESHOLD_MS
    : false;

  return { telemetry, history, plantInfo, isStale, loading, error };
}
