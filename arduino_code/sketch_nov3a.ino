#include <DallasTemperature.h>

#include <OneWire.h>

// ===== Smart Olive Grove - Lecteur de Capteurs =====
// Code pour Arduino/ESP32 - Envoie les données au port série
// Format: Soil raw: X | Soil %: Y | Rain raw: Z | Rain %: W | Temp: T °C | Rain DO: D

#include <OneWire.h>
#include <DallasTemperature.h>

// ===== Configuration des Pins =====
#define PIN_SOIL_ADC 34
#define PIN_RAIN_ADC 35
#define PIN_RAIN_DO  27
#define PIN_DS18B20  4

// ===== OneWire et DallasTemperature =====
OneWire oneWire(PIN_DS18B20);
DallasTemperature ds(&oneWire);

// ===== Calibration du capteur d'humidité du sol =====
int SOIL_AIR_RAW   = 3200;  // dry calibration
int SOIL_WATER_RAW = 1500;  // wet calibration

// ===== Fonctions utilitaires =====
int clampi(int v, int a, int b) {
    return v < a ? a : (v > b ? b : v);
}

int soilPctFromRaw(int raw) {
    raw = clampi(raw, SOIL_WATER_RAW, SOIL_AIR_RAW);
    float pct = 100.0 * (float)(SOIL_AIR_RAW - raw) / (float)(SOIL_AIR_RAW - SOIL_WATER_RAW);
    return clampi((int)(pct + 0.5), 0, 100);
}

int rainPctFromRaw(int raw) {
    float pct = 100.0 * (4095 - raw) / 4095.0;
    return clampi((int)(pct + 0.5), 0, 100);
}

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== Smart Olive Grove - Lecteur de Capteurs ===");
    Serial.println("Démarrage des capteurs...");

    // Initialiser les pins
    pinMode(PIN_RAIN_DO, INPUT_PULLUP);
    ds.begin();

    Serial.println("Capteurs initialisés!");
    Serial.println("Envoi des données toutes les 2 secondes...\n");
}

void loop() {
    // Lire les capteurs
    int rawSoil = analogRead(PIN_SOIL_ADC);
    int soilPct = soilPctFromRaw(rawSoil);

    int rawRain = analogRead(PIN_RAIN_ADC);
    int rainPct = rainPctFromRaw(rawRain);
    int rainDO  = digitalRead(PIN_RAIN_DO);

    ds.requestTemperatures();
    float tempC = ds.getTempCByIndex(0);

    // Envoyer les données dans le format attendu par l'interface web
    // Format: Soil raw: X | Soil %: Y | Rain raw: Z | Rain %: W | Temp: T °C | Rain DO: D
    Serial.print("Soil raw: ");
    Serial.print(rawSoil);
    Serial.print(" | Soil %: ");
    Serial.print(soilPct);
    Serial.print(" | Rain raw: ");
    Serial.print(rawRain);
    Serial.print(" | Rain %: ");
    Serial.print(rainPct);
    Serial.print(" | Temp: ");
    if (tempC == DEVICE_DISCONNECTED_C) {
        Serial.print("ERR");
    } else {
        Serial.print(tempC, 2);
    }
    Serial.print(" °C | Rain DO: ");
    Serial.println(rainDO);

    delay(2000);
}
