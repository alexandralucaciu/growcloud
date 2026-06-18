// api/telemetry/latest.js

let cachedToken = null;
let cachedTokenAt = 0; // ms
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 min (safe default)

async function tbLogin(serverUrl, username, password) {
  const res = await fetch(`${serverUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`TB auth failed: ${res.status}`);
  const data = await res.json();
  if (!data.token) throw new Error("TB auth failed: token missing");
  return data.token;
}

import { kv } from '@vercel/kv';

// Calculează seria de zile consecutive (streak) și o salvează în Vercel KV,
// împreună cu data ultimei vizite a utilizatorului.
async function tbHandleCloudStreak(deviceId, todayStr) {
  const streakKey = `streak:${deviceId}:count`;
  const visitKey = `streak:${deviceId}:last_visit`;

  let currentCloudStreak = 1;
  let cloudLastVisit = "";

  // 1. CITIRE: luăm datele din Vercel KV
  try {
    const savedStreak = await kv.get(streakKey);
    const savedVisit = await kv.get(visitKey);

    if (savedStreak !== null) currentCloudStreak = Number(savedStreak);
    if (savedVisit !== null) cloudLastVisit = String(savedVisit);
  } catch (err) {
    console.error("Eroare la citirea din Vercel KV:", err);
  }

  // Calculăm ieri în format local YYYY-MM-DD
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('sv-SE', { timeZone: 'Europe/Bucharest' });

  let finalStreak = currentCloudStreak;

  // Dacă este prima vizită din această zi calendaristică, recalculăm streak-ul
  if (cloudLastVisit !== todayStr) {
    if (cloudLastVisit === yesterdayStr) {
      finalStreak += 1; // A intrat și ieri -> crește streak-ul
    } else if (cloudLastVisit !== '') {
      finalStreak = 1;  // A trecut mai mult de o zi -> reset la 1
    } else {
      finalStreak = 1;  // Prima inițializare în baza de date
    }

    // 2. SALVARE PERMANENTĂ: scriem valorile în Vercel KV
    try {
      await kv.set(streakKey, finalStreak);
      await kv.set(visitKey, todayStr);
    } catch (saveErr) {
      console.error("Eroare la salvarea în Vercel KV:", saveErr);
    }
  }

  return finalStreak;
}

async function tbHandleSaturation(deviceId, soil, nowMs) {
  const sinceKey = `saturation:${deviceId}:since`;
  const SAT_THRESHOLD = 95;
  const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;

  if (soil === null || soil < SAT_THRESHOLD) {
    await kv.del(sinceKey);
    return { saturatedSince: null, overSaturated24h: false };
  }

  let since = await kv.get(sinceKey);
  if (since === null) {
    since = nowMs;
    await kv.set(sinceKey, since);
  }
  since = Number(since);

  return { saturatedSince: since, overSaturated24h: nowMs - since >= TWENTY_FOUR_H };
}

async function tbFetchLatest(serverUrl, token, deviceId, keys) {
  const url =
    `${serverUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries` +
    `?keys=${encodeURIComponent(keys.join(","))}`;

  const res = await fetch(url, {
    headers: { "X-Authorization": `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("TB unauthorized");
  if (!res.ok) throw new Error(`TB telemetry failed: ${res.status}`);
  return res.json();
}

function pick(tbData, key, fallback = null) {
  const arr = tbData?.[key];
  if (!arr || !arr[0]) return { value: fallback, ts: null };
  return { value: arr[0].value, ts: arr[0].ts };
}

function toNum(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req, res) {
  try {
    const serverUrl = process.env.TB_SERVER_URL;
    const username = process.env.TB_USERNAME;
    const password = process.env.TB_PASSWORD;
    const deviceId = process.env.TB_DEVICE_ID;

    if (!serverUrl || !username || !password || !deviceId) {
      return res.status(500).json({
        error: "Missing env vars",
        needed: ["TB_SERVER_URL", "TB_USERNAME", "TB_PASSWORD", "TB_DEVICE_ID"],
      });
    }

    // Apel automat venit de la cron: nu actualizăm streak-ul/vizita la acest apel,
    // ca sarcina programată să nu marcheze utilizatorul ca activ în fiecare zi.
    const isCron = !!process.env.CRON_SECRET &&
      req.headers['x-cron-secret'] === process.env.CRON_SECRET;

    // Reutilizăm token-ul cât timp este valabil
    const now = Date.now();
    if (!cachedToken || now - cachedTokenAt > TOKEN_TTL_MS) {
      cachedToken = await tbLogin(serverUrl, username, password);
      cachedTokenAt = now;
    }

    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Bucharest' });

    // PASUL 1: citirea telemetriei proaspete
    const keys = ["temperature", "humidity", "soil", "light"];
    let tbData;

    try {
      tbData = await tbFetchLatest(serverUrl, cachedToken, deviceId, keys);
    } catch (e) {
      // Dacă token-ul a expirat, reîncercăm o singură dată
      if (String(e.message || "").includes("unauthorized")) {
        cachedToken = await tbLogin(serverUrl, username, password);
        cachedTokenAt = Date.now();
        tbData = await tbFetchLatest(serverUrl, cachedToken, deviceId, keys);
      } else {
        throw e;
      }
    }

    // PASUL 2: calcularea și salvarea streak-ului (doar la apeluri reale ale aplicației)
    let careStreak = 1;
    if (!isCron) {
      try {
        careStreak = await tbHandleCloudStreak(deviceId, todayStr);
      } catch (err) {
        console.error("In-handler streak management error:", err);
      }
    }

    // PASUL 3: extragerea valorilor
    const t = pick(tbData, "temperature");
    const h = pick(tbData, "humidity");
    const s = pick(tbData, "soil");
    const l = pick(tbData, "light");

    let saturation = { overSaturated24h: false };
    try {
      saturation = await tbHandleSaturation(deviceId, toNum(s.value), Date.now());
    } catch (err) {
      console.error("Saturation tracking error:", err);
    }

    const ts = t.ts ?? h.ts ?? s.ts ?? l.ts ?? Date.now();

    // PASUL 4: returnarea JSON-ului curat către aplicație
    return res.status(200).json({
      deviceId,
      temperature: toNum(t.value),
      airHumidity: toNum(h.value),
      soilMoisture: toNum(s.value),
      soilOverSaturated24h: saturation.overSaturated24h,
      lightLevel: toNum(l.value),
      timestamp: new Date(ts).toISOString(),
      lastUserVisitDate: todayStr,
      careStreak: careStreak,
    });

  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
