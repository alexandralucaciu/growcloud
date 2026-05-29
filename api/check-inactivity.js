import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // 1. Verificarea securității pentru Vercel Cron
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Neautorizat' });
  }

  try {
    const localTelemetryUrl = `${process.env.VERCEL_PROJECT_URL}/api/telemetry/latest`;
    
    // Configurație sigură de timeout local (îi lăsăm 8 secunde să termine login-ul și fetch-ul)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(localTelemetryUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(200).json({ 
        success: false, 
        message: `Endpoint-ul latest.js a returnat eroarea: ${response.status}`,
        details: errorData.details || 'Timeout/Eroare ThingsBoard'
      });
    }

    const telemetryData = await response.json();

    // ADAPTARE LA CODUL TĂU: latest.js returnează un șir ISO în câmpul `timestamp`
    if (!telemetryData.timestamp) {
      return res.status(200).json({ 
        success: false, 
        message: 'Nu s-a găsit câmpul timestamp în structura returnată de latest.js.',
        debugReceivedData: telemetryData 
      });
    }

    // Convertim string-ul ISO înapoi în milisecunde pentru calculul diferenței
    const lastTelemetryTimestamp = new Date(telemetryData.timestamp).getTime();
    const now = Date.now();
    const fortyEightHoursInMs = 2 * 24 * 60 * 60 * 1000; // 48 de ore

    // 2. Verificăm dacă diferența este mai mare de 48 de ore
    if (now - lastTelemetryTimestamp > fortyEightHoursInMs) {
      
      // 3. Trimitem email-ul prin Resend
      const emailResult = await resend.emails.send({
        from: 'GrowCloud Alerts <alerts@growcloud.internal>',
        to: process.env.USER_ALERT_EMAIL, 
        subject: '🚨 [GrowCloud] Planta ta are nevoie de atenție!',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2e7d32;">Salutare!</h2>
            <p>Am observat că sistemul tău IoT <strong>GrowCloud</strong> nu a mai transmis date în ultimele 48 de ore.</p>
            <p>Ultima înregistrare validă în baza de date a fost la data de: <strong>${telemetryData.timestamp}</strong>.</p>
            <p>În acest interval, microclimatul plantei tale <em>Spathiphyllum</em> a rămas nemonitorizat. Există riscul ca solul să fie complet uscat sau suprasaturat.</p>
            <p style="margin-top: 25px;">
              <a href="${process.env.VERCEL_PROJECT_URL}" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Deschide Dashboard-ul Web
              </a>
            </p>
            <br>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #777;">Acest email a fost generat automat de serviciul Vercel Cron Jobs în urma interogării API-ului intern.</p>
          </div>
        `
      });

      return res.status(200).json({ success: true, message: 'Alerta de inactivitate a fost trimisă pe email.', id: emailResult.id });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Sistemul este activ. Telemetrie recentă prezentă în ultimele 48h.',
      lastSeen: telemetryData.timestamp 
    });

  } catch (error) {
    return res.status(200).json({ 
      success: false, 
      error_detected: error.message,
      message: "Procesul de verificare a fost interceptat în siguranță la nivel de mediu Serverless."
    });
  }
}
