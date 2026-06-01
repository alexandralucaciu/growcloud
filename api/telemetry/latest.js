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

// 1. FUNCȚIE MODIFICATĂ: Citește și salvează Streak-ul + Vizita direct în Server Attributes
async function tbHandleCloudStreak(serverUrl, token, deviceId, todayStr) {
  // URL-ul complet (cu SERVER_SCOPE) este valid doar pentru citirea datelor (GET)
  const attrGetUrl = `${serverUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE`;
  
  // URL-ul pentru salvarea datelor (POST) trebuie să fie mai scurt în ThingsBoard
  const attrPostUrl = `${serverUrl}/api/plugins/telemetry/DEVICE/${deviceId}/SERVER_SCOPE/attributes`;
  
  let currentCloudStreak = 1;
  let cloudLastVisit = "";

  try {
    // 1. CITIRE (Rămâne neschimbată, folosind attrGetUrl)
    const attrRes = await fetch(attrGetUrl, {
      headers: { "X-Authorization": `Bearer ${token}` },
    });
    
    if (attrRes.ok) {
      const attrs = await attrRes.json();
      const streakObj = attrs.find(a => a.key === 'cloud_streak_count');
      const visitObj = attrs.find(a => a.key === 'cloud_last_visit_date');
      
      if (streakObj) currentCloudStreak = Number(streakObj.value || '1');
      if (visitObj) cloudLastVisit = visitObj.value || '';
    }
  } catch (err) {
    console.error("Eroare la citirea atributelor de streak:", err);
  }

  // Calculăm ieri în format local YYYY-MM-DD
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('sv-SE', { timeZone: 'Europe/Bucharest' });

  let finalStreak = currentCloudStreak;

  // Dacă este prima vizită din această zi, recalculăm streak-ul
  if (cloudLastVisit !== todayStr) {
    if (cloudLastVisit === yesterdayStr) {
      finalStreak += 1; 
    } else if (cloudLastVisit !== '') {
      finalStreak = 1;  
    } else {
      finalStreak = 1;  
    }

    try {
      // 2. SALVARE (Modificată pentru a vedea eroarea exactă)
      const saveRes = await fetch(attrPostUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "X-Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          cloud_streak_count: String(finalStreak),
          cloud_last_visit_date: todayStr,
          lastUserVisitDate: todayStr 
        }),
      });

      if (!saveRes.ok) {
        const errText = await saveRes.text();
        throw new Error(`ThingsBoard a respins salvarea (Status ${saveRes.status}): ${errText}`);
      }
    } catch (saveErr) {
      console.error("Eroare la salvarea noilor atribute în TB:", saveErr);
      // ARUNCĂM EROAREA MAI DEPARTE ca să o vedem în browser în caz de eșec!
      throw saveErr; 
    }
  }

  return finalStreak;
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

  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Bucharest' });
    
    // --- PASUL 1: CITIREA TELEMETRIEI PROASPETE (MUTATĂ SUS) ---
    const keys = ["temperature", "humidity", "soil", "light", "battery"];
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

    // --- PASUL 2: CALCULAREA ȘI SALVAREA STREAK-ULUI (MUTATĂ JOS) ---
    let careStreak = 1;
    try {
      careStreak = await tbHandleCloudStreak(serverUrl, cachedToken, deviceId, todayStr);
    } catch (err) {
      console.error("In-handler streak management error:", err);
    }

    // --- PASUL 3: EXTRAGEREA VALORILOR ---
    const t = pick(tbData, "temperature");
    const h = pick(tbData, "humidity");
    const s = pick(tbData, "soil");
    const l = pick(tbData, "light");
    const b = pick(tbData, "battery", "100");

    const ts = t.ts ?? h.ts ?? s.ts ?? l.ts ?? b.ts ?? Date.now();

    // --- PASUL 4: RETURNARE JSON CĂTRE FRONTEND ---
    return res.status(200).json({
      deviceId,
      temperature: toNum(t.value),
      airHumidity: toNum(h.value),
      soilMoisture: toNum(s.value),
      lightLevel: toNum(l.value),
      batteryPercent: toNum(b.value),
      timestamp: new Date(ts).toISOString(),
      lastUserVisitDate: todayStr,
      careStreak: careStreak 
    });

  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}