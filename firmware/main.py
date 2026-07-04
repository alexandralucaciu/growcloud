from machine import Pin, I2C, ADC
import sh1106
from framebuf import FrameBuffer, MONO_HLSB
from sprites import root
from umqttsimple import MQTTClient
import time
import dht

# ---------------- Configurare ThingsBoard ----------------
TB_SERVER = "eu.thingsboard.cloud"
ACCESS_TOKEN = "***"   # token mascat

# ---------------- Configurare periferice ----------------
# Senzori
dht_sensor = dht.DHT22(Pin(16))

soil_adc = ADC(Pin(4))
soil_adc.width(ADC.WIDTH_13BIT)   # 0-8191
soil_adc.atten(ADC.ATTN_11DB)

# Buton (pull-up intern, tratat prin intrerupere)
button = Pin(5, Pin.IN, Pin.PULL_UP)

# Magistrala I2C comuna: OLED + BH1750
i2c = I2C(0, scl=Pin(9), sda=Pin(8), freq=400000)
BH1750_ADDR = 0x23

# ---------------- Initializare OLED ----------------
oled_functional = False
try:
    oled = sh1106.SH1106_I2C(width=128, height=64, i2c=i2c, addr=0x3c)
    oled.write_cmd(0xAE)   # Display OFF
    oled.write_cmd(0x8D)   # activare pompa de sarcina
    oled.write_cmd(0x14)
    oled.write_cmd(0xAF)   # Display ON
    oled.sleep(False)
    oled.contrast(0xFF)    # contrast maxim
    oled.fill(0)
    oled.show()
    oled_functional = True
except Exception as e:
    print("Eroare la initializarea OLED:", e)

# ---------------- Functii senzor lumina ----------------
def get_lux():
    try:
        i2c.writeto(BH1750_ADDR, b'\x10')
        time.sleep(0.2)
        data = i2c.readfrom(BH1750_ADDR, 2)
        return int((data[0] << 8 | data[1]) / 1.2)
    except:
        return -1

# ---------------- Functii desen ecran ----------------
def thick_hline(oled, x, y, width, thickness):
    for i in range(thickness):
        oled.hline(x, y + i, width, 1)

def thick_vline(oled, x, y, height, thickness):
    for i in range(thickness):
        oled.vline(x + i, y, height, 1)

def invert_fb_percent(fb, width, height, percent):
    percent = max(0, min(100, percent))
    lines_to_invert = int(height * percent / 100)
    for y in range(height - lines_to_invert, height):
        for x in range(width):
            current = fb.pixel(x, y)
            fb.pixel(x, y, 1 - current)

# ---------------- Control afisaj ----------------
ecran_pornit = True
timp_stingere_ecran = time.ticks_ms()

def aprinde_ecran():
    global ecran_pornit, timp_stingere_ecran
    if oled_functional:
        oled.write_cmd(0xAF)                            # pornire afisaj
        ecran_pornit = True
        timp_stingere_ecran = time.ticks_ms() + 10000   # ramane aprins 10 s

def stinge_ecran():
    global ecran_pornit
    if oled_functional:
        oled.write_cmd(0xAE)                            # stingere afisaj (consum minim)
        ecran_pornit = False

def button_pressed_handler(pin):
    aprinde_ecran()

# Declansare pe front descendent (butonul face contact la GND)
button.irq(trigger=Pin.IRQ_FALLING, handler=button_pressed_handler)

# ---------------- Functie desenare cadru ----------------
def deseneaza_ecran(t, h, lux, soil_moisture):
    oled.fill(0)

    root_copy = bytearray(root)
    fb_root = FrameBuffer(root_copy, 80, 64, MONO_HLSB)
    invert_fb_percent(fb_root, 80, 64, soil_moisture)
    oled.blit(fb_root, 0, 0)

    # Chenare
    thick_vline(oled, 0, 0, 64, 3)
    thick_vline(oled, 77, 0, 64, 3)
    thick_vline(oled, 125, 0, 64, 3)
    thick_hline(oled, 0, 0, 128, 3)
    thick_hline(oled, 0, 61, 128, 3)

    # Text
    oled.text(f"{t}C", 85, 10)
    oled.text(f"H:{h}%", 82, 30)
    if lux > 999:
        oled.text(f"{lux//1000}kLx", 82, 50)
    else:
        oled.text(f"{lux}Lx", 82, 50)
    oled.show()

# ---------------- Bucla principala ----------------
INTERVAL_CLOUD = 2 * 60 * 60 * 1000                        # 2 ore, in milisecunde
ultima_trimitere_cloud = time.ticks_ms() - INTERVAL_CLOUD  # forteaza prima trimitere la boot

print("Incepem monitorizarea...")

while True:
    try:
        timp_curent = time.ticks_ms()

        # --- Mod automat: transmitere la fiecare 2 ore ---
        if time.ticks_diff(timp_curent, ultima_trimitere_cloud) >= INTERVAL_CLOUD:
            aprinde_ecran()                                # indicator vizual al transmisiei

            try:
                dht_sensor.measure()
                t, h = int(dht_sensor.temperature()), int(dht_sensor.humidity())
            except:
                t, h = -1, -1                              # valoare-santinela in caz de eroare

            lux = get_lux()

            suma_sol = 0
            for _ in range(50):                            # mediere pe 50 de esantioane
                suma_sol += soil_adc.read()
                time.sleep(0.01)
            val_raw = int(suma_sol / 50)
            soil_moisture = max(0, min(100, ((8191 - val_raw) * 100) // (8191 - 3320)))

            # Publicare telemetrie prin MQTT
            try:
                client = MQTTClient("ESP32S2_Final_Test", TB_SERVER, user=ACCESS_TOKEN, password="")
                client.connect()                           # port 1883, fara TLS (implicit)
                payload = '{"temperature":%d, "humidity":%d, "soil":%d, "light":%d}' % (t, h, soil_moisture, lux)
                client.publish("v1/devices/me/telemetry", payload)
                client.disconnect()                        # inchide socketul (sesiune scurta)
            except Exception as mqtt_err:
                print("[CLOUD] Eroare la trimiterea MQTT:", mqtt_err)

            ultima_trimitere_cloud = time.ticks_ms()

        # --- Stingerea automata a ecranului dupa 10 s ---
        if ecran_pornit and time.ticks_diff(time.ticks_ms(), timp_stingere_ecran) >= 0:
            stinge_ecran()

        # --- Reimprospatarea afisajului cat timp e pornit ---
        if ecran_pornit:
            try:
                dht_sensor.measure()
                t, h = int(dht_sensor.temperature()), int(dht_sensor.humidity())
            except:
                t, h = -1, -1

            lux = get_lux()

            suma_sol = 0
            for _ in range(20):                            # mediere mai usoara pentru afisaj
                suma_sol += soil_adc.read()
                time.sleep(0.01)
            val_raw = int(suma_sol / 20)
            soil_moisture = max(0, min(100, ((8191 - val_raw) * 100) // (8191 - 3320)))

            if oled_functional:
                deseneaza_ecran(t, h, lux, soil_moisture)

    except Exception as e:
        print("Eroare in loop:", e)

    time.sleep(0.1)
