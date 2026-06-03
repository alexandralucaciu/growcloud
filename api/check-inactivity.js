import { Resend } from 'resend';
import { kv } from '@vercel/kv';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Verificarea de securitate obligatorie pentru Vercel Crons
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Neautorizat' });
  }

  // Chei unice în Vercel KV pentru a preveni spamul zilnic de emailuri
  const deviceAlertKey = `alert:${process.env.TB_DEVICE_ID || '2f815460-54fd-11f1-be5a-b9befc3a4888'}:device_email_sent`;
  const userAlertKey = `alert:${process.env.TB_DEVICE_ID || '2f815460-54fd-11f1-be5a-b9befc3a4888'}:user_email_sent`;

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
    
    // 2. Interogăm ThingsBoard pentru lastActivityTime (Server Scope)
    const tbServer = process.env.TB_SERVER_URL || 'https://eu.thingsboard.cloud';
    const deviceId = process.env.TB_DEVICE_ID || '2f815460-54fd-11f1-be5a-b9befc3a4888';
    
    // Corecție URL: Am adăugat /SERVER_SCOPE ca să găsească direct atributul nativ
    const attributesUrl = `${tbServer}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE?keys=lastActivityTime`;
    
    let lastUserVisitTimestamp = lastDeviceTimestamp; 

    try {
      const authRes = await fetch(`${tbServer}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: process.env.TB_USERNAME, 
          password: process.env.TB_PASSWORD 
        }),
      });
      
      if (authRes.ok) {
        const authData = await authRes.json();
        const attrRes = await fetch(attributesUrl, {
          headers: { "X-Authorization": `Bearer ${authData.token}` }
        });
        
        if (attrRes.ok) {
          const attrData = await attrRes.json();
          const activityAttr = Array.isArray(attrData) ? attrData.find(a => a.key === 'lastActivityTime') : null;
          // În ThingsBoard, valoarea timestamp-ului brut este direct în proprietatea .value
          if (activityAttr && activityAttr.value) {
            lastUserVisitTimestamp = Number(activityAttr.value); 
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
    if (now - lastUserVisitTimestamp > fortyEightHoursInMs) {
      // Verificăm în Vercel KV dacă am trimis deja acest mail de user inactive
      const alreadySentUser = await kv.get(userAlertKey);

      if (!alreadySentUser) {
        emailReason = "user_inactive";
        await resend.emails.send({
          from: 'GrowCloud Alerts <onboarding@resend.dev>',
          to: process.env.USER_ALERT_EMAIL || 'alexandra.lucaciu@student.upt.ro',
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
        await kv.set(userAlertKey, "true");
        emailSent = true;
      }
    } else {
      // Dacă userul a intrat în timp util, resetăm alerta în KV pentru viitor
      await kv.del(userAlertKey);
    }
    
    // CONDIȚIA 2: Hardware/Baterie (Dispozitivul e offline, chiar dacă userul se uită pe site)
    if (!emailSent && (now - lastDeviceTimestamp > fortyEightHoursInMs)) {
      const alreadySentDevice = await kv.get(deviceAlertKey);

      if (!alreadySentDevice) {
        emailReason = "device_offline";
        await resend.emails.send({
          from: 'GrowCloud Alerts <onboarding@resend.dev>',
          to: process.env.USER_ALERT_EMAIL || 'alexandra.lucaciu@student.upt.ro',
          subject: '🚨 [GrowCloud] Dispozitivul tău IoT este Offline!',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #d32f2f;">Sistemul GrowCloud s-a deconectat!</h2>
              <p>Placa ta ESP32-S2 Mini nu a mai trimis date de telemetrie în ultimele 48 de ore.</p>
              <p>Mergi la ghiveci și repornește dispozitivul sau încarcă bateria pentru a nu lăsa planta nemonitorizată.</p>
            </div>
          `
        });
        await kv.set(deviceAlertKey, "true");
        emailSent = true;
      }
    } else if (now - lastDeviceTimestamp <= fortyEightHoursInMs) {
      // Dacă placa trimite date din nou și e online, resetăm alerta în KV
      await kv.del(deviceAlertKey);
    }

    if (emailSent) {
      return res.status(200).json({ success: true, message: `Email trimis pentru: ${emailReason}` });
    }

    return res.status(200).json({ success: true, message: 'Utilizatorul și dispozitivul sunt activi, sau mailul a fost deja trimis.' });

  } catch (error) {
    console.error("Eroare în Cron Handler:", error);
    return res.status(200).json({ success: false, error: error.message });
  }
}