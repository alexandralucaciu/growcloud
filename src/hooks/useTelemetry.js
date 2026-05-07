// useTelemetry.js — custom hook that loads telemetry data from the service layer.
// Components use this hook; they never import from services or data directly.
// To switch from mock to real data, update telemetryService.js only.

import { useState, useEffect } from 'react';
import {
  fetchLatestTelemetry,
  fetchHistoricalData,
  fetchPlantInfo,
} from '../services/telemetryService';

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

    async function load() {
      try {
        setLoading(true);
        const [t, h, p] = await Promise.all([
          fetchLatestTelemetry(),
          fetchHistoricalData(),
          fetchPlantInfo(),
        ]);
        if (!cancelled) {
          setTelemetry(t);
          setHistory(h);
          setPlantInfo(p);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const isStale = telemetry
    ? Date.now() - new Date(telemetry.timestamp).getTime() > STALE_THRESHOLD_MS
    : false;

  return { telemetry, history, plantInfo, isStale, loading, error };
}
