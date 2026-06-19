// useTelemetry.js — custom hook that loads telemetry data from the service layer.
// Components use this hook; they never import from services or data directly.
// To switch from mock to real data, update telemetryService.js only.

import { useState, useEffect } from 'react';
import {
  fetchLatestTelemetry,
  fetchPlantInfo,
} from '../services/telemetryService';
import { TB_CONFIG } from '../config/thingsboard';

// Data older than this is considered stale
// The device transmits one reading every 2 hours via a softwaare timer
// a 5-hour threshold tolerates one fully missed transmission before the
// UI flags the data as stale.
const STALE_THRESHOLD_MS = 1 * 60 * 1000;

/**
 * Loads latest telemetry and plant info.
 * Returns { telemetry, plantInfo, isStale, loading, error }
 */
export function useTelemetry() {
  const [telemetry, setTelemetry] = useState(null);
  const [plantInfo, setPlantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    let pollInterval = null;
    let clockInterval = null;

async function fetchLiveTelemetry() {
  try {
    const res = await fetch("/api/telemetry/latest", { cache: "no-store" });
    if (!res.ok) throw new Error("API latest telemetry failed");

    const data = await res.json();

    if (!cancelled) {
      setTelemetry(data);
      setError(null);
    }
  } catch (err) {
    console.error("Live fetch error:", err);
    if (!cancelled) setError(err.message || "Failed to load live data");
  } finally {
    if (!cancelled) setLoading(false);
  }
}

    async function load() {
      try {
        setLoading(true);
        // Load static metadata first so pages can render labels immediately.
        const p = await fetchPlantInfo();
        if (!cancelled) {
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
    clockInterval = setInterval(() => {
      setNow(Date.now());
    }, 60 * 1000);

    return () => { 
      cancelled = true; 
      if (pollInterval) clearInterval(pollInterval);
      if (clockInterval) clearInterval(clockInterval);
    };
  }, []);

  const isStale = telemetry
    ? now - new Date(telemetry.timestamp).getTime() > STALE_THRESHOLD_MS
    : false;

  return { telemetry, plantInfo, isStale, loading, error };
}
