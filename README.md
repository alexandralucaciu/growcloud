# GrowCloud

Sistem IoT de monitorizare a microclimatului unei plante de apartament (Spathiphyllum).

Lucrare de licență, Universitatea Politehnica Timișoara, Ingineria Sistemelor, sesiunea iulie 2026.
Autor: Alexandra Lucaciu. Coordonator: Ș.l.dr.ing. Paul NEGÎRLA.

## Repository

- Adresă: https://github.com/alexandralucaciu/growcloud
- Repository privat, partajat intern la cerere coordonatorului și comisiei de evaluare.
- Conține doar cod sursă, fără fișiere binare compilate (`node_modules` și `dist` sunt excluse). Credențialele nu sunt incluse, ci configurate prin variabile de mediu.

## Arhitectură

- Dispozitiv ESP32-S2 Mini (MicroPython): citește temperatura, umiditatea aerului, umiditatea solului și lumina; afișează pe OLED; trimite telemetria prin MQTT la fiecare 2 ore.
- ThingsBoard Cloud: stochează telemetria ca serii de timp.
- Aplicație web React/Vite + funcții serverless Vercel: dashboard, evaluarea stării plantei, alerte pe email.

## Structura repository-ului

- `firmware/` – cod dispozitiv (MicroPython)
  - `boot.py`, `main.py` – dezvoltate în cadrul lucrării
  - `sh1106.py`, `umqttsimple.py`, `sprites.py` – module preluate (driver OLED, client MQTT, sprite)
- `api/` – funcții serverless Vercel
  - `telemetry/latest.js` – proxy securizat către ThingsBoard
  - `check-inactivity.js` – cron pentru alerte pe email
- `src/` – aplicația web (React)
- `vercel.json`, `vite.config.js`, `index.html`, `public/` – configurare

## Firmware (ESP32-S2 Mini)

Cerințe: placă ESP32-S2 Mini cu MicroPython, mediul Thonny. Codul nu se compilează, se rulează direct pe placă.

Instalare și lansare:
1. Conectează placa la calculator prin USB-C.
2. În `firmware/boot.py`, completează `SSID` și `PASS` (Wi-Fi).
3. În `firmware/main.py`, completează `ACCESS_TOKEN` (token ThingsBoard).
4. Copiază toate fișierele din `firmware/` pe placă.
5. La alimentare, `boot.py` conectează Wi-Fi, iar `main.py` pornește automat.

## Aplicația web (React/Vite + Vercel)

Cerințe: Node.js 18+ (dezvoltat pe 22), npm.

Variabile de mediu (fișier `.env`):
- `TB_SERVER_URL`, `TB_USERNAME`, `TB_PASSWORD`, `TB_DEVICE_ID` – ThingsBoard
- `RESEND_API_KEY`, `USER_ALERT_EMAIL` – alerte email (Resend)
- `CRON_SECRET` – protejarea cron-ului
- `VERCEL_PROJECT_URL` – adresa aplicației

Compilare:
```
npm install
npm run build
```

Lansare locală (dezvoltare):
```
npm run dev
```
Aplicația pornește pe `http://localhost:5173`.

Producție: găzduită pe Vercel (instalare dependențe, build și publicarea funcțiilor din `api/` automat; cron configurat în `vercel.json`).
