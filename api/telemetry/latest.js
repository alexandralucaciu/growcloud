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

    // Reuse token when possible
    const now = Date.now();
    if (!cachedToken || now - cachedTokenAt > TOKEN_TTL_MS) {
      cachedToken = await tbLogin(serverUrl, username, password);
      cachedTokenAt = now;
    }

    const keys = ["temperature", "humidity", "soil", "light", "battery"];
    let tbData;

    try {
      tbData = await tbFetchLatest(serverUrl, cachedToken, deviceId, keys);
    } catch (e) {
      // If token expired/revoked, retry once
      if (String(e.message || "").includes("unauthorized")) {
        cachedToken = await tbLogin(serverUrl, username, password);
        cachedTokenAt = Date.now();
        tbData = await tbFetchLatest(serverUrl, cachedToken, deviceId, keys);
      } else {
        throw e;
      }
    }

    const t = pick(tbData, "temperature");
    const h = pick(tbData, "humidity");
    const s = pick(tbData, "soil");
    const l = pick(tbData, "light");
    const b = pick(tbData, "battery", "100");

    const ts = t.ts ?? h.ts ?? s.ts ?? l.ts ?? b.ts ?? Date.now();

    return res.status(200).json({
      deviceId,
      temperature: toNum(t.value),
      airHumidity: toNum(h.value),
      soilMoisture: toNum(s.value),
      lightLevel: toNum(l.value),
      batteryPercent: toNum(b.value),
      timestamp: new Date(ts).toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
