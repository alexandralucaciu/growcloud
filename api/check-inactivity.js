import { Resend } from 'resend';
import { kv } from '@vercel/kv';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Verificare de securitate: doar planificatorul Vercel Cron poate declanșa funcția
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Neautorizat' });
  }

  const deviceId = process.env.TB_DEVICE_ID;
  const alertEmail = process.env.USER_ALERT_EMAIL;
  if (!deviceId || !alertEmail) {
    return res.status(500).json({
      success: false,
      message: 'Lipsesc variabilele de mediu TB_DEVICE_ID și/sau USER_ALERT_EMAIL.',
    });
  }

  // Chei în Vercel KV pentru a nu trimite repetat același email
  const deviceAlertKey = `alert:${deviceId}:device_email_sent`;
  const userAlertKey = `alert:${deviceId}:user_email_sent`;
  const visitKey = `streak:${deviceId}:last_visit`;

  try {
    const telemetryUrl = `${process.env.VERCEL_PROJECT_URL}/api/telemetry/latest`;

    // Antetul x-cron-secret spune funcției latest.js să NU actualizeze data
    // ultimei vizite la acest apel automat (altfel cron-ul ar marca zilnic
    // utilizatorul ca activ și condiția de inactivitate nu s-ar declanșa niciodată).
    const response = await fetch(telemetryUrl, {
      headers: { 'x-cron-secret': process.env.CRON_SECRET },
    });
    if (!response.ok) {
      throw new Error(`Eroare la citirea datelor din latest.js: ${response.statusText}`);
    }

    const telemetryData = await response.json();
    if (!telemetryData.timestamp) {
      return res.status(200).json({ success: false, message: 'Lipsește timestamp-ul telemetriei.' });
    }

    const now = Date.now();
    const FORTY_EIGHT_H = 2 * 24 * 60 * 60 * 1000; // 48 de ore

    // Ultima citire reală a dispozitivului
    const lastDeviceTimestamp = new Date(telemetryData.timestamp).getTime();

    // Data ultimei vizite a utilizatorului, salvată în KV de logica de streak
    // (format YYYY-MM-DD); lipsa ei înseamnă că nu a existat nicio vizită
    const lastVisitStr = await kv.get(visitKey);
    const lastVisitTimestamp = lastVisitStr ? new Date(lastVisitStr).getTime() : 0;

    const deviceOffline = now - lastDeviceTimestamp > FORTY_EIGHT_H;
    const userInactive = now - lastVisitTimestamp > FORTY_EIGHT_H;

    let emailSent = false;
    let emailReason = '';

    // CONDIȚIA 1 (prioritară): dispozitivul nu a mai transmis de peste 48 de ore
    if (deviceOffline) {
      const alreadySentDevice = await kv.get(deviceAlertKey);
      if (!alreadySentDevice) {
        emailReason = 'device_offline';
        await resend.emails.send({
          from: 'GrowCloud Alerts <onboarding@resend.dev>',
          to: alertEmail,
          subject: '🚨 [GrowCloud] Dispozitivul tău IoT este Offline!',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #d32f2f;">Sistemul GrowCloud s-a deconectat!</h2>
              <p>Placa ta ESP32-S2 Mini nu a mai trimis date de telemetrie în ultimele 48 de ore.</p>
              <p>Mergi la ghiveci și repornește dispozitivul sau încarcă bateria pentru a nu lăsa planta nemonitorizată.</p>
            </div>
          `,
        });
        await kv.set(deviceAlertKey, 'true');
        emailSent = true;
      }
    } else {
      // Dispozitivul transmite din nou: resetăm alerta pentru viitor
      await kv.del(deviceAlertKey);
    }

    // CONDIȚIA 2: dispozitivul este online, dar utilizatorul nu a mai
    // deschis aplicația de peste 2 zile (reminder de continuitate a îngrijirii)
    if (!userInactive) {
      await kv.del(userAlertKey);
    } else if (!deviceOffline) {
      const alreadySentUser = await kv.get(userAlertKey);
      if (!alreadySentUser) {
        emailReason = emailReason || 'user_inactive';
        await resend.emails.send({
          from: 'GrowCloud Alerts <onboarding@resend.dev>',
          to: alertEmail,
          subject: '🔥 [GrowCloud] Nu-ți pierde Care Streak-ul! Planta ta te așteaptă',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #e65100;">Salutare! Spathiphyllum îți simte lipsa! 🌿</h2>
              <p>Au trecut mai mult de <strong>2 zile</strong> de când nu ai mai deschis dashboard-ul <strong>GrowCloud</strong>.</p>
              <p>Dacă nu vizitezi aplicația astăzi, îți vei pierde seria de zile consecutive (Care Streak).</p>
              <p style="margin-top: 25px;">
                <a href="${process.env.VERCEL_PROJECT_URL}" style="background-color: #e65100; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Salvează Streak-ul Meu!
                </a>
              </p>
            </div>
          `,
        });
        await kv.set(userAlertKey, 'true');
        emailSent = true;
      }
    }

    if (emailSent) {
      return res.status(200).json({ success: true, message: `Email trimis pentru: ${emailReason}` });
    }
    return res.status(200).json({ success: true, message: 'Utilizatorul și dispozitivul sunt activi, sau emailul a fost deja trimis.' });

  } catch (error) {
    console.error('Eroare în Cron Handler:', error);
    return res.status(200).json({ success: false, error: error.message });
  }
}
