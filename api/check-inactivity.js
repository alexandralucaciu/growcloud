import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Verificarea securității pentru Vercel Cron
  const authHeader = req.headers['authorization'];
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Neautorizat' });
  }

  try {
    // Validare: Ne asigurăm că ID-ul dispozitivului există în mediu
    if (!process.env.TB_DEVICE_ID) {
      return res.status(500).json({ success: false, message: 'Lipseste variabila TB_DEVICE_ID din Vercel.' });
    }

    // CORECTURĂ URL: Folosim endpoint-ul public/REST de telemetrie bazat pe Device ID
    const tbUrl = `https://cloud.thingsboard.io/api/plugins/telemetry/DEVICE/${process.env.TB_DEVICE_ID}/values/attributes?keys=lastConnectTime`;
    
    const tbResponse = await fetch(tbUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!tbResponse.ok) {
      throw new Error(`Eroare la comunicarea cu ThingsBoard: ${tbResponse.status} ${tbResponse.statusText}`);
    }
    
    const attributesArray = await tbResponse.json();
    
    // ThingsBoard returnează de obicei datele sub formă de array pentru acest tip de cerere:
    // [{ key: "lastConnectTime", lastUpdateTs: 17169..., value: ... }]
    const lastConnectAttr = Array.isArray(attributesArray) 
      ? attributesArray.find(attr => attr.key === 'lastConnectTime')
      : null;
      
    // Extragem timestamp-ul ultimei modificări (în milisecunde)
    const lastTelemetryTimestamp = lastConnectAttr ? lastConnectAttr.lastUpdateTs : null;
    
    if (!lastTelemetryTimestamp) {
      return res.status(400).json({ success: false, message: 'Nu s-a putut extrage timestamp-ul pentru lastConnectTime. Verifică cheia în ThingsBoard.' });
    }

    const now = Date.now();
    const fortyEightHoursInMs = 2 * 24 * 60 * 60 * 1000; // 48 de ore

    // Verificăm dacă diferența este mai mare de 2 zile
    if (now - lastTelemetryTimestamp > fortyEightHoursInMs) {
      
      // Declanșăm trimiterea email-ului de re-engagement prin Resend
      const emailResult = await resend.emails.send({
        from: 'GrowCloud Alerts <alerts@growcloud.internal>',
        to: process.env.USER_ALERT_EMAIL, 
        subject: '🚨 [GrowCloud] Planta ta are nevoie de atenție!',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2e7d32;">Salutare!</h2>
            <p>Am observat că sistemul tău IoT <strong>GrowCloud</strong> nu a mai transmis date în ultimele 48 de ore.</p>
            <p>În acest interval, microclimatul plantei tale <em>Spathiphyllum</em> a rămas nemonitorizat. Există riscul ca solul să fie complet uscat sau, dimpotrivă, suprasaturat (risc de asfixiere radiculară).</p>
            <p style="margin-top: 25px;">
              <a href="${process.env.VERCEL_PROJECT_URL}" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Deschide Dashboard-ul Web
              </a>
            </p>
            <br>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #777;">Acest email a fost generat automat de serviciul Vercel Cron Jobs în urma analizării telemetriei din ThingsBoard Cloud.</p>
          </div>
        `
      });

      return res.status(200).json({ success: true, message: 'Alerta de inactivitate a fost trimisă pe email.', id: emailResult.id });
    }

    // Dacă sistemul a trimis date recent
    return res.status(200).json({ success: true, message: 'Sistemul este activ. Telemetrie recepționată în ultimele 48h.' });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
