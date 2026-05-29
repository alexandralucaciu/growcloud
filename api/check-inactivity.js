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

    // Verificăm timestamp-ul senzorilor (hardware)
    if (!telemetryData.timestamp) {
      return res.status(200).json({ success: false, message: 'Lipseste timestamp-ul telemetriei.' });
    }

    const lastDeviceTimestamp = new Date(telemetryData.timestamp).getTime();
    
    // Preluăm data ultimei vizite transmise de latest.js (user engagement)
    const lastUserVisitStr = telemetryData.lastUserVisitDate || new Date(lastDeviceTimestamp).toISOString().split('T')[0];
    const lastUserVisitTimestamp = new Date(lastUserVisitStr).getTime();

    const now = Date.now();
    const fortyEightHoursInMs = 2 * 24 * 60 * 60 * 1000; // 48 de ore

    let emailSent = false;
    let emailReason = "";

    // CONDIȚIA 1: Engagement Utilizator (Nu a mai intrat de 2 zile)
    if (now - lastUserVisitTimestamp > fortyEightHoursInMs) {
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
    
    // CONDIȚIA 2: Hardware/Baterie (Dispozitivul e offline, chiar dacă userul e activ)
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
