import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // REPARAȚIE: În Node.js, headerele se citesc ca proprietăți de obiect în litere mici
  const authHeader = req.headers['authorization'];
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Neautorizat' });
  }

  try {
    // 2. Interogăm ThingsBoard API pentru a obține timestamp-ul ultimei telemetrii transmise de ESP32
    // Înlocuiește cu URL-ul serverului tău dacă folosești ThingsBoard Cloud sau instanță proprie
    const tbUrl = `https://cloud.thingsboard.io/api/v1/${process.env.THINGSBOARD_ACCESS_TOKEN}/attributes`;
    
    const tbResponse = await fetch(tbUrl);
    if (!tbResponse.ok) {
      throw new Error(`Eroare la comunicarea cu ThingsBoard: ${tbResponse.statusText}`);
    }
    
    const attributes = await tbResponse.json();
    
    // Extragere timestamp (ThingsBoard returnează de obicei timestamp în milisecunde pentru atribute/telemetrie)
    const lastTelemetryTimestamp = attributes.lastConnectTime || attributes.ts; 
    
    if (!lastTelemetryTimestamp) {
      return res.status(400).json({ success: false, message: 'Nu s-a găsit timestamp-ul ultimei citiri.' });
    }

    const now = Date.now();
    const fortyEightHoursInMs = 2 * 24 * 60 * 60 * 1000; // 48 de ore exprimate în milisecunde

    // 3. Verificăm dacă diferența este mai mare de 2 zile (48 de ore)
    if (now - lastTelemetryTimestamp > fortyEightHoursInMs) {
      
      // 4. Declanșăm trimiterea email-ului de re-engagement
      const emailResult = await resend.emails.send({
        from: 'GrowCloud Alerts <alerts@growcloud.internal>',
        to: process.env.USER_ALERT_EMAIL, // Email-ul tău unde vrei să primești alerta
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

    // Dacă sistemul a trimis date recent, nu facem nimic
    return res.status(200).json({ success: true, message: 'Sistemul este activ. Telemetrie recepționată în ultimele 48h.' });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
