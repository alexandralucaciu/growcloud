# GrowCloud: Smart IoT Microclimate Monitoring System

An end-to-end IoT system designed to monitor and optimize the microclimate of indoor houseplants (*Spathiphyllum*). The project integrates a battery-powered edge sensing node, ThingsBoard Cloud telemetry, serverless proxy functions, and a responsive React web dashboard.

*Bachelor's Thesis Project — Politehnica University of Timișoara, Systems Engineering (Automation and Applied Informatics), July 2026.*
*Author: Alexandra Buhai (Lucaciu) | Coordinator: Ș.l.dr.ing. Paul Negîrla*

---

## System Architecture

The project follows a three-tier architecture:

1. **Edge Node (ESP32-S2 Mini):** Acquires sensor data (temperature, air humidity, ambient light, and capacitive soil moisture), provides local visual feedback via an OLED display, and transmits telemetry over MQTT every 2 hours (or on-demand via push button).
2. **Cloud Backend (ThingsBoard Cloud):** Collects and persists time-series telemetry data and manages historical logs.
3. **Serverless Layer & Web Application (React / Vite + Vercel):**
   - **Secure Serverless Proxy:** Isolates ThingsBoard credentials within backend environment variables (`process.env`). The client-side application queries internal endpoints (`/api/telemetry/latest`), preventing credential leakage.
   - **Vercel KV (Redis):** Handles persistent state tracking across serverless invocations (e.g., 24-hour soil oversaturation detection, daily user streak, and anti-duplicate email alert throttling).
   - **Automated Alerts:** Cron functions notify users via email (Resend API) when the device goes offline or critical thresholds are breached.
   - **Web Dashboard:** Displays live vs. stale data indicators, plant health status (normal, warning, critical), customized watering guides, and historical charts.

---

## Hardware Components & Enclosure

- **Microcontroller:** ESP32-S2 Mini (MicroPython runtime)
- **Environmental Sensor:** DHT22 (Air Temperature & Humidity)
- **Light Sensor:** BH1750 (I2C ambient light sensor in Lux)
- **Soil Moisture Sensor:** Capacitive Soil Moisture Sensor v2.0 (corrosion-resistant analog probe)
- **Display:** 1.3" I2C OLED Display (SH1106 driver)
- **Power Management:** 3.7V 2000 mAh Li-Po battery, TP4056 USB-C charging/protection module, 3.7V-to-5V step-up boost converter, and mechanical toggle switch
- **Enclosure:** Custom 3D-printed two-piece enclosure designed and sliced for optimal component placement and thermal isolation

---

## Firmware Features (MicroPython)

- **Digital Filtering & Soil Calibration:** 50-sample moving average filter on analog readings to suppress electrical noise. Maps inverted raw ADC values (8191 for dry air, 3320 for saturated water) to a 0–100% moisture scale.
- **Fault-Tolerant Acquisition:** Implements sentinel error values (-1) if a sensor fails, ensuring uninterrupted MQTT transmission cycles.
- **Dual Acquisition Modes:** Automated background interval transmission (every 2 hours) and instant on-demand reading triggered by a hardware button.

---

## Repository Structure

```
├── api/
│   ├── check-inactivity.js       # Vercel cron function for inactivity/offline email alerts
│   └── telemetry/
│       └── latest.js             # Secure backend proxy to ThingsBoard API
├── firmware/
│   ├── boot.py                   # Wi-Fi initialization
│   ├── main.py                   # Main sampling loop, digital filtering, and MQTT client
│   ├── sh1106.py                 # OLED display driver
│   ├── sprites.py                # Graphical UI assets for the OLED screen
│   └── umqttsimple.py            # Lightweight MQTT implementation
├── src/                          # React web application (UI components, hooks, charts)
├── public/                       # Static web assets
├── index.html                    # Web entry point
├── vercel.json                   # Vercel deployment and cron configuration
└── vite.config.js                # Vite build configuration
```

---

## Gallery & Demo

<p align="center">
  <img src="./docs/images/front%20picture.jpeg" alt="GrowCloud device - front view" width="45%" />
  <img src="./docs/images/back%20picture.jpeg" alt="GrowCloud device - back view" width="45%" />
</p>

📹 **Demo video:** hosted on OneDrive due to file size — see [docs/video/Lucaciu_Alexandra_Video_AIA_Licenta.pdf](./docs/video/Lucaciu_Alexandra_Video_AIA_Licenta.pdf) for the link.

---

## Getting Started

### 1. Firmware Setup (ESP32-S2 Mini)

1. Flash MicroPython firmware onto the ESP32-S2 Mini using Thonny IDE or `esptool`.
2. Open `firmware/boot.py` and configure your local Wi-Fi credentials:

   ```python
   SSID = "YOUR_WIFI_SSID"
   PASS = "YOUR_WIFI_PASSWORD"
   ```

3. Open `firmware/main.py` and insert your ThingsBoard device token:

   ```python
   ACCESS_TOKEN = "YOUR_THINGSBOARD_TOKEN"
   ```

4. Upload all files from the `firmware/` directory directly to the root of the ESP32 filesystem.
5. The device connects to Wi-Fi on boot and begins periodic telemetry reporting.

### 2. Web Application Setup (Local Development)

**Prerequisites**

- Node.js 18+ (tested on Node 22)
- npm

**Environment Variables**

Create a `.env` file in the root directory and configure the required keys:

```
TB_SERVER_URL=https://thingsboard.cloud
TB_USERNAME=your_thingsboard_username
TB_PASSWORD=your_thingsboard_password
TB_DEVICE_ID=your_device_id
RESEND_API_KEY=your_resend_api_key
USER_ALERT_EMAIL=user@example.com
CRON_SECRET=your_secure_cron_secret
VERCEL_PROJECT_URL=http://localhost:5173
```

**Installation and Execution**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will be accessible locally at `http://localhost:5173`.

---

## Deployment

The web dashboard and serverless endpoints are configured for continuous deployment on Vercel. Environment variables are managed securely through the Vercel project dashboard, and cron schedules in `vercel.json` run automated inactivity and health checks without requiring dedicated server infrastructure.

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
