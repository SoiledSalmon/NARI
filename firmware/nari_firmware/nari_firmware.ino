// =============================================================
// nari_firmware.ino
// Board  : ESP32-S3 Wroom-1 (edgehax)
// Sensors: MAX30102 (HR/IBI) + MPU6500 (IMU) + Microphone
// Backend: POST /ingest  — { userId, hr, ibi, imu[10] }
// =============================================================
//
// LIBRARY MANAGER — install these:
//   1. "SparkFun MAX3010x Pulse and Proximity Sensor Library"
//      (search: MAX3010x)  →  provides MAX30105.h + heartRate.h
//   2. "MPU9250_WE" by Wolfgang Ewald
//      (search: MPU9250_WE) →  provides MPU6500_WE.h
//   3. "ArduinoJson" by Benoit Blanchon
//      (search: ArduinoJson) →  install v6.x ONLY, NOT v7
//   WiFi.h / HTTPClient.h / Wire.h are built into the ESP32 core.
//
// =============================================================

// *** IMPORTANT: ArduinoJson v6.x ONLY ***
// StaticJsonDocument is v6 syntax. v7 replaced it with JsonDocument
// and will throw compile errors on this file. Pin to 6.x in
// Library Manager (latest is 6.21.x as of 2025).

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>    // v6.x only — see note above
#include "MAX30105.h"        // SparkFun MAX3010x library
#include "heartRate.h"       // Bundled with SparkFun MAX3010x
#include <MPU6500_WE.h>      // Part of MPU9250_WE library by Wolfgang Ewald

#include "secrets.h"

// =============================================================
// PIN DEFINITIONS  (ESP32-S3 Wroom-1)
// SDA=8, SCL=9 as wired. Both sensors share the same I2C bus.
// MPU6500 I2C address: 0x68
// MAX30102 I2C address: 0x57  — no conflict
// =============================================================
#define SDA_PIN  8
#define SCL_PIN  9
#define MIC_PIN  4   // Analog mic on GPIO4

// =============================================================
// SENSOR OBJECTS
// =============================================================
#define MPU6500_ADDR 0x68
MPU6500_WE  myMPU6500(MPU6500_ADDR);
MAX30105    particleSensor;

// =============================================================
// SAMPLING CONFIG
// =============================================================
const int          SAMPLE_RATE_HZ      = 50;
const int          BATCH_SIZE          = 10;
const unsigned long SAMPLE_INTERVAL_MS = 1000 / SAMPLE_RATE_HZ;  // 20ms

// =============================================================
// HEART RATE STATE
// =============================================================
const byte RATE_SIZE     = 4;
byte       rates[RATE_SIZE];
byte       rateSpot      = 0;
long       lastBeat      = 0;
float      beatsPerMinute = 75.0;
int        beatAvg       = 75;
float      currentIBI    = 800.0;
bool       fingerDetected  = false;
bool       max30102Present = false;  // set in setup(); HR code skipped if false

// =============================================================
// IMU BATCH BUFFER
// =============================================================
struct ImuSample {
  float ax, ay, az;
  float gx, gy, gz;
};
ImuSample    imuBatch[BATCH_SIZE];
int          batchIndex      = 0;
unsigned long lastSampleTime = 0;

// =============================================================
// MICROPHONE
// Sampled once per batch using a dedicated 50ms blocking window,
// matching the original sensor test sketch exactly.
// A 200ms rolling window accumulates ADC noise across hundreds of
// reads and easily exceeds the scream threshold even in silence.
// A tight 50ms window gives a stable, comparable reading.
// NOT in the backend payload — local emergency alerts only.
// =============================================================
int  peakToPeak = 0;

#define NORMAL_SOUND 40
#define LOUD_SOUND   120
#define SCREAM_SOUND 250

// IMU thresholds for local emergency detection
#define FALL_THRESHOLD   0.4f
#define IMPACT_THRESHOLD 2.5f
#define SHAKE_THRESHOLD  3.5f

// Last batch's final IMU sample — used in local alert check
// (avoids a redundant I2C read inside checkLocalAlerts)
float lastAx, lastAy, lastAz;
float lastGx, lastGy, lastGz;

// =============================================================
// FORWARD DECLARATIONS
// =============================================================
void reconnectWiFi();
void sendBatch();
void checkLocalAlerts();

// =============================================================
// SETUP
// =============================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  // ── I2C ──────────────────────────────────────────────────
  // Must be called before any sensor init so both libraries
  // inherit the correct SDA/SCL pins from the Wire object.
  Wire.begin(SDA_PIN, SCL_PIN);

  // ── Microphone ───────────────────────────────────────────
  analogReadResolution(12);          // 0–4095
  analogSetAttenuation(ADC_11db);    // Full 0–3.3V range
  pinMode(MIC_PIN, INPUT);

  // ── WiFi ─────────────────────────────────────────────────
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.print("\nWiFi connected — IP: ");
  Serial.println(WiFi.localIP());

  // ── MPU6500 ──────────────────────────────────────────────
  Serial.println("Initializing MPU6500...");
  if (!myMPU6500.init()) {
    // init() checks the WHO_AM_I register (expects 0x70 for MPU6500).
    // If it fails: check SDA=8 SCL=9 wiring, 3.3V power, and pull-up
    // resistors (4.7kΩ to 3.3V on both SDA and SCL).
    while (1) {
      Serial.println("ERROR: MPU6500 not found. Check wiring on SDA=8, SCL=9.");
      delay(5000);
    }
  }

  // Keep the device still for ~1s during auto-calibration
  Serial.println("Calibrating MPU6500 — hold device still...");
  delay(1000);
  myMPU6500.autoOffsets();            // Zero out resting offsets
  myMPU6500.enableGyrDLPF();          // Digital low-pass filter on gyro
  myMPU6500.setGyrDLPF(MPU6500_DLPF_6);
  myMPU6500.setSampleRateDivider(5);  // 1kHz ÷ (5+1) ≈ 166Hz internal; we poll at 50Hz
  myMPU6500.setGyrRange(MPU6500_GYRO_RANGE_500);   // ±500 deg/s
  myMPU6500.setAccRange(MPU6500_ACC_RANGE_4G);      // ±4g
  Serial.println("MPU6500 ready.");

  // ── MAX30102 ─────────────────────────────────────────────
  Serial.println("Initializing MAX30102...");
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("WARNING: MAX30102 not found — continuing without HR/IBI.");
    Serial.println("hr and ibi will be sent as 0.0 in every payload.");
    max30102Present = false;
  } else {
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
    max30102Present = true;
    Serial.println("MAX30102 ready.");
  }

  Serial.println("\nStarting data collection.");
}

// =============================================================
// MAIN LOOP
// =============================================================
void loop() {
  unsigned long now = millis();

  // ── MAX30102: continuous beat detection ──────────────────
  // Skipped entirely if sensor wasn't found at boot.
  if (max30102Present) {
    long irValue = particleSensor.getIR();
    fingerDetected = (irValue > 50000);

    if (fingerDetected && checkForBeat(irValue)) {
      long delta = now - lastBeat;
      lastBeat = now;
      if (delta > 250 && delta < 2000) {
        currentIBI    = (float)delta;
        beatsPerMinute = 60.0f / (delta / 1000.0f);
        rates[rateSpot++] = (byte)beatsPerMinute;
        rateSpot %= RATE_SIZE;
        beatAvg = 0;
        for (byte x = 0; x < RATE_SIZE; x++) beatAvg += rates[x];
        beatAvg /= RATE_SIZE;
      }
    }
  }

  // ── IMU: 50Hz timed sampling ─────────────────────────────
  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    lastSampleTime = now;

    xyzFloat acc = myMPU6500.getGValues();
    xyzFloat gyr = myMPU6500.getGyrValues();

    imuBatch[batchIndex].ax = acc.x;
    imuBatch[batchIndex].ay = acc.y;
    imuBatch[batchIndex].az = acc.z;
    imuBatch[batchIndex].gx = gyr.x;
    imuBatch[batchIndex].gy = gyr.y;
    imuBatch[batchIndex].gz = gyr.z;

    lastAx = acc.x; lastAy = acc.y; lastAz = acc.z;
    lastGx = gyr.x; lastGy = gyr.y; lastGz = gyr.z;

    batchIndex++;

    if (batchIndex >= BATCH_SIZE) {
      // ── Microphone: 50ms blocking window ─────────────────
      // Taken once per batch, identical to the original sensor
      // test sketch. A tight 50ms window prevents ADC noise
      // from accumulating into false scream detections.
      int sigMax = 0, sigMin = 4095;
      unsigned long micStart = millis();
      while (millis() - micStart < 50) {
        int s = analogRead(MIC_PIN);
        if (s > sigMax) sigMax = s;
        if (s < sigMin) sigMin = s;
      }
      peakToPeak = sigMax - sigMin;

      checkLocalAlerts();
      reconnectWiFi();
      sendBatch();
      batchIndex = 0;
    }
  }
}

// =============================================================
// WIFI RECONNECT
// Non-blocking timeout: waits up to 10s, then gives up and retries
// on the next batch (200ms later). Does not freeze the device.
// =============================================================
void reconnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("WiFi lost — reconnecting");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nReconnected.");
  } else {
    Serial.println("\nReconnect failed — will retry next batch.");
  }
}

// =============================================================
// SEND BATCH
// JSON payload matches backend schema exactly:
// { userId: str, hr: float, ibi: float, imu: [{ax,ay,az,gx,gy,gz}×10] }
// Timestamp is NOT sent — backend adds it on receipt (time.time()).
// hr/ibi are sent as 0.0 when no finger is detected.
// =============================================================
void sendBatch() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Skipping POST — no WiFi.");
    return;
  }

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);

  // Size estimate: 10 samples × (6 floats × ~8 chars + 6 keys × ~4 chars) 
  // = 10 × ~72 = ~720 bytes + outer fields + JSON structure ≈ ~900 bytes.
  // Using 2048 for safe headroom — fits comfortably in ESP32-S3 SRAM.
  // If you increase BATCH_SIZE beyond 20, bump this to 4096.
  StaticJsonDocument<2048> doc;

  doc["userId"] = USER_ID;
  // Send 0.0 if no finger on sensor. Backend schema declares hr/ibi as float;
  // Pydantic will accept this cleanly.
  doc["hr"]  = fingerDetected ? (float)beatAvg : 0.0f;
  doc["ibi"] = fingerDetected ? currentIBI     : 0.0f;

  JsonArray imuArray = doc.createNestedArray("imu");
  for (int i = 0; i < BATCH_SIZE; i++) {
    JsonObject s = imuArray.createNestedObject();
    s["ax"] = imuBatch[i].ax;
    s["ay"] = imuBatch[i].ay;
    s["az"] = imuBatch[i].az;
    s["gx"] = imuBatch[i].gx;
    s["gy"] = imuBatch[i].gy;
    s["gz"] = imuBatch[i].gz;
  }

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);
  if (httpCode > 0) {
    Serial.printf("[POST] HTTP %d\n", httpCode);
  } else {
    Serial.printf("[POST] Error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

// =============================================================
// LOCAL EMERGENCY DETECTION
// Logic mirrors the original sensor test sketch exactly:
// all four sound levels + all motion states + combined trigger.
// =============================================================
void checkLocalAlerts() {
  float totalAccel = sqrt(lastAx*lastAx + lastAy*lastAy + lastAz*lastAz);
  float totalGyro  = sqrt(lastGx*lastGx + lastGy*lastGy + lastGz*lastGz);

  // ── Motion status ─────────────────────────────────────────
  if (totalAccel > 0.8 && totalAccel < IMPACT_THRESHOLD && totalGyro < SHAKE_THRESHOLD) {
    Serial.println("STATUS: Normal movement");
  }
  if (totalAccel < FALL_THRESHOLD) {
    Serial.println("[WARNING] Possible free fall!");
  }
  if (totalAccel > IMPACT_THRESHOLD) {
    Serial.println("[DANGER] Strong impact detected!");
  }
  if (totalGyro > SHAKE_THRESHOLD) {
    Serial.println("[ALERT] Rapid body/hand movement!");
  }

  // ── Sound status ──────────────────────────────────────────
  if (peakToPeak < NORMAL_SOUND) {
    Serial.println("SOUND: Quiet environment");
  } else if (peakToPeak < LOUD_SOUND) {
    Serial.println("SOUND: Normal talking");
  } else if (peakToPeak < SCREAM_SOUND) {
    Serial.println("[WARNING] Loud noise detected!");
  } else {
    Serial.println("[ALERT] Possible scream detected!");
  }

  // ── Combined emergency ────────────────────────────────────
  if ((totalAccel > IMPACT_THRESHOLD && totalGyro > SHAKE_THRESHOLD) ||
      (peakToPeak > SCREAM_SOUND     && totalGyro > SHAKE_THRESHOLD)) {
    Serial.println("####################################");
    Serial.println(" EMERGENCY: Possible attack/distress");
    Serial.println("####################################");
  }
}
