import network
import time

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)

    # Resetam interfata pentru a preveni "Internal State Error"
    wlan.active(False)
    time.sleep(0.5)
    wlan.active(True)

    SSID = "***"
    PASS = "***"

    if not wlan.isconnected():
        print('Se conecteaza la WiFi...')
        wlan.connect(SSID, PASS)

        timeout = 0
        while not wlan.isconnected() and timeout < 10:
            status = wlan.status()
            if status == network.STAT_WRONG_PASSWORD:
                print("Eroare: Parola incorecta!")
                break
            elif status == network.STAT_BEACON_TIMEOUT:
                print("Eroare: Router-ul nu raspunde.")
                break

            print(".", end="")
            time.sleep(1)
            timeout += 1

    if wlan.isconnected():
        print('\nWiFi conectat! IP:', wlan.ifconfig()[0])
    else:
        print('\nWiFi fail! Status:', wlan.status())

connect_wifi()
