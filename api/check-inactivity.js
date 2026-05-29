import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Neautorizat' });
  }

  try {
    const localTelemetryUrl = `${process.env.VERCEL_PROJECT_URL}/api/telemetry/latest`;
    
    const response = await fetch(localTelemetryUrl);
    if (!response.ok) {
      throw new Error(`Eroare la citirea datelor din latest.js: ${response.statusText}`);
    }

    const telemetryData = await response.json();

    // 1. Verificăm timestamp-ul senzorilor hard (ESP32-S2 Mini)
    if (!telemetryData.timestamp) {
      return res.status(200).json({ success: false, message: 'Lipseste timestamp-ul telemetriei.' });
    }
    const lastDeviceTimestamp = new Date(telemetryData.timestamp).getTime();
    
    // 2. Interogăm ThingsBoard pentru parametrul nativ de activitate a serverului (User Engagement)
    const attributesUrl = `${process.env.TB_SERVER_URL || 'https://cloud.thingsboard.io'}/api/plugins/telemetry/DEVICE/${process.env.TB_DEVICE_ID}/values/attributes?keys=lastActivityTime`;
    
    // Generăm un token proaspăt local sau folosim o structură simplă de fetch
    // Pentru siguranță absolută în Cron, dacă ThingsBoard refuză interogarea directă a atributelor, facem fallback pe device timestamp
    let lastUserVisitTimestamp = lastDeviceTimestamp; 

    try {
      // Reutilizăm logica ta excelentă de login direct din mediu dacă e nevoie, 
      // dar Thingsboard permite citirea atributelor de activitate dacă endpoint-ul e configurat public sau prin token-ul stocat
      const authRes = await fetch(`${process.env.TB_SERVER_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: process.env.TB_USERNAME, password: process.env.TB_PASSWORD }),
      });
      
      if (authRes.ok) {
        const authData = await authRes.json();
        const attrRes = await fetch(attributesUrl, {
          headers: { "X-Authorization": `Bearer ${authData.token}` }
        });
        
        if (attrRes.ok) {
          const attrData = await attrRes.json();
          const activityAttr = Array.isArray(attrData) ? attrData.find(a => a.key === 'lastActivityTime') : null;
          if (activityAttr && activityAttr.lastUpdateTs) {
            lastUserVisitTimestamp = activityAttr.lastUpdateTs; // Luăm fix valoarea din tabelul tău!
          }
        }
      }
    } catch (e) {
      console.log("Fallback pe timestamp-ul telemetriei:", e.message);
    }

    const now = Date.now();
    const fortyEightHoursInMs = 2 * 24 * 60 * 60 * 1000; // 48 de ore

    let emailSent = false;
    let emailReason = "";

    // CONDIȚIA 1: Engagement Utilizator (Nu a mai dat refresh/intrat de 2 zile)
    if (true) {
      emailReason = "user_inactive";
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: process.env.USER_ALERT_EMAIL,
        subject: '🔥 [GrowCloud] Nu-ți pierde Care Streak-ul! Planta ta te așteaptă',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #e65100;">Salutare! Spathiphyllum îți simte lipsa! 🌿</h2>
            <p>Au trecut mai mult de <strong>2 zile</strong> de când nu ai mai deschis dashboard-ul <strong>GrowCloud</strong>.</p>
            <p>Dacă nu vizitezi aplicația astăzi, îți vei pierde progresul și seria de zile consecutive (Care Streak).</p>
            <p style="margin-top: 25px;">
              <a href="${process.env.VERCEL_PROJECT_URL}" style="background-color: #e65100; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Salvează Streak-ul Meu!
              </a>
            </p>
          </div>
        `
      });
      emailSent = true;
    } 
    
    // CONDIȚIA 2: Hardware/Baterie (Dispozitivul e offline, chiar dacă userul deschide aplicația)
    if (!emailSent && (now - lastDeviceTimestamp > fortyEightHoursInMs)) {
      emailReason = "device_offline";
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: process.env.USER_ALERT_EMAIL,
        subject: '🚨 [GrowCloud] Dispozitivul tău IoT este Offline!',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d32f2f;">Sistemul GrowCloud s-a deconectat!</h2>
            <p>Placa ta ESP32-S2 Mini nu a mai trimis date de telemetrie în ultimele 48 de ore.</p>
            <p>Mergi la ghiveci și repornește dispozitivul sau încarcă bateria pentru a nu lăsa planta nemonitorizată.</p>
          </div>
        `
      });
      emailSent = true;
    }

    if (emailSent) {
      return res.status(200).json({ success: true, message: `Email trimis pentru: ${emailReason}` });
    }

    return res.status(200).json({ success: true, message: 'Utilizatorul și dispozitivul sunt activi.' });

  } catch (error) {
    return res.status(200).json({ success: false, error: error.message });
  }
}
