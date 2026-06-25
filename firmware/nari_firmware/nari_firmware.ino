// =============================================================
// nari_firmware_wifi.ino
// Board  : ESP32-S3 Wroom-1
// Sensors: MAX30102 (HR/SpO2) + MPU6050 (IMU) + Microphone
// Backend: POST /ingest — chunked JSON over WiFi
//          + Serial analysis report (printAnalysis)
//
// WiFi transport ported from nari_firmware_merged.ino.
// Original MPU6050 / analysis logic preserved verbatim.
//
// LIBRARY MANAGER — install these:
//   1. "SparkFun MAX3010x Pulse and Proximity Sensor Library"
//      (search: MAX3010x) → MAX30105.h + heartRate.h + spo2_algorithm.h
//   2. "MPU6050" by Electronic Cats (or i2cdevlib)
//      (search: MPU6050) → MPU6050.h
//   3. WiFi.h / HTTPClient.h / Wire.h / WiFiClient.h — ESP32 core
//
// Create a secrets.h in the same sketch folder:
//   #pragma once
//   #define WIFI_SSID    "your_ssid"
//   #define WIFI_PASS    "your_password"
//   #define BACKEND_URL  "http://192.168.x.x:PORT/ingest"
//   #define API_KEY      "your_api_key"
// =============================================================

#include <WiFi.h>
#include <WiFiClient.h>
#include <Wire.h>
#include <MPU6050.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"
#include "secrets.h"   // WIFI_SSID, WIFI_PASS, BACKEND_URL, API_KEY

// ─── Pins ─────────────────────────────────────
#define MPU_SDA  8
#define MPU_SCL  9
#define MIC_PIN  4

// ─── Sensors ──────────────────────────────────
MPU6050  mpu;
MAX30105 particleSensor;

// ─── HR ───────────────────────────────────────
const byte RATE_SIZE = 8;
byte  rates[RATE_SIZE];
byte  rateSpot       = 0;
long  lastBeat       = 0;
float beatsPerMinute = 0;
int   beatAvg        = 0;

// ─── SpO2 ─────────────────────────────────────
uint32_t irBuffer[100];
uint32_t redBuffer[100];
int32_t  spo2_calc           = 0;
int8_t   validSPO2           = 0;
int32_t  heartRate_spo2      = 0;
int8_t   validHeartRate_spo2 = 0;
int      spo2_value          = 97;

// ─── Buffers ──────────────────────────────────
float   hr_buffer[10];
int     hr_index = 0;

float   imu_buffer[200][6];
int     imu_index = 0;

int16_t audio_buffer[15360];

// ─── Timers ───────────────────────────────────
unsigned long lastIMU_ms  = 0;
unsigned long lastHRStore = 0;
unsigned long lastSend_ms = 0;

// ─── IMU scale factors ────────────────────────
const float ACCEL_SCALE = 16384.0;
const float GYRO_SCALE  = 131.0;

// ─── Audio ────────────────────────────────────
#define SAMPLE_DELAY_US 56

// ─── Chunked HTTP ─────────────────────────────
#define CHUNK_BUF_SIZE 256
static char       chunkBuf[CHUNK_BUF_SIZE];
static int        chunkLen  = 0;
static WiFiClient* g_client = nullptr;

// ─── Forward declarations ─────────────────────
void reconnectWiFi();
void sendPayloadChunked();
void readHR();
void readIMU();
void updateSpO2();
void captureAudio();
void printAnalysis();
float getAvgHR();
float getPeakAccelG();
float getPeakGyroMag();
float getAudioRMS();
static void flushChunk();
static inline void emitChar(char c);
static void emitStr(const char* s);
static void emitFloat(float v, int decimals);

// ══════════════════════════════════════════════
void setup() {
    Serial.begin(115200);
    delay(1000);

    Wire.begin(MPU_SDA, MPU_SCL);

    // ── WiFi ──────────────────────────────────
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.print("\nWiFi connected — IP: ");
    Serial.println(WiFi.localIP());

    // ── MAX30102 ──────────────────────────────
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
        Serial.println("MAX30102 not found! Check wiring.");
        while (1);
    }
    particleSensor.setup(60, 4, 2, 100, 411, 4096);
    Serial.println("MAX30102 ready");

    // ── MPU6050 ───────────────────────────────
    mpu.initialize();
    if (mpu.testConnection())
        Serial.println("MPU6050 ready");
    else
        Serial.println("MPU6050 FAILED");

    // ── Microphone ────────────────────────────
    pinMode(MIC_PIN, INPUT);
    Serial.println("MAX9814 ready");

    memset(hr_buffer,    0, sizeof(hr_buffer));
    memset(imu_buffer,   0, sizeof(imu_buffer));
    memset(audio_buffer, 0, sizeof(audio_buffer));

    lastSend_ms = millis();
    lastHRStore = millis();
    lastIMU_ms  = millis();

    Serial.println("Waiting for 10s data window...");
}

// ══════════════════════════════════════════════
void loop() {
    readHR();

    if (millis() - lastIMU_ms >= 20) {
        lastIMU_ms = millis();
        readIMU();
    }

    if (millis() - lastHRStore >= 1000) {
        lastHRStore = millis();
        hr_buffer[hr_index % 10] = (float)beatAvg;
        hr_index++;
    }

    if (millis() - lastSend_ms >= 10000 && hr_index >= 10) {
        lastSend_ms = millis();

        updateSpO2();    // ~1 s blocking
        captureAudio();  // ~1 s blocking

        // ── Serial analysis report (retained from original) ──
        printAnalysis();

        // ── WiFi POST to backend ─────────────────────────────
        reconnectWiFi();
        sendPayloadChunked();
    }
}

// ══════════════════════════════════════════════
void readHR() {
    long irValue = particleSensor.getIR();
    if (checkForBeat(irValue)) {
        long delta = millis() - lastBeat;
        lastBeat = millis();
        beatsPerMinute = 60.0 / (delta / 1000.0);
        beatsPerMinute += 90;   // calibration offset — preserved from original

        if (beatsPerMinute > 20 && beatsPerMinute < 255) {
            rates[rateSpot++] = (byte)beatsPerMinute;
            rateSpot %= RATE_SIZE;

            beatAvg = 0;
            for (byte x = 0; x < RATE_SIZE; x++) beatAvg += rates[x];
            beatAvg /= RATE_SIZE;
        }
    }
}

// ══════════════════════════════════════════════
void readIMU() {
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

    int idx = imu_index % 200;
    imu_buffer[idx][0] = ax / ACCEL_SCALE;
    imu_buffer[idx][1] = ay / ACCEL_SCALE;
    imu_buffer[idx][2] = az / ACCEL_SCALE;
    imu_buffer[idx][3] = gx / GYRO_SCALE;
    imu_buffer[idx][4] = gy / GYRO_SCALE;
    imu_buffer[idx][5] = gz / GYRO_SCALE;
    imu_index++;
}

// ══════════════════════════════════════════════
void updateSpO2() {
    particleSensor.clearFIFO();

    for (byte i = 0; i < 100; i++) {
        while (!particleSensor.available())
            particleSensor.check();

        redBuffer[i] = particleSensor.getRed();
        irBuffer[i]  = particleSensor.getIR();
        particleSensor.nextSample();
    }

    maxim_heart_rate_and_oxygen_saturation(
        irBuffer, 100, redBuffer,
        &spo2_calc, &validSPO2,
        &heartRate_spo2, &validHeartRate_spo2
    );

    if (validSPO2 && spo2_calc >= 70 && spo2_calc <= 100) {
        spo2_value = (int)spo2_calc;
    }
}

// ══════════════════════════════════════════════
void captureAudio() {
    long dcSum = 0;
    for (int i = 0; i < 64; i++) dcSum += analogRead(MIC_PIN);
    int dc = (int)(dcSum / 64);

    for (int i = 0; i < 15360; i++) {
        int raw = (analogRead(MIC_PIN) + analogRead(MIC_PIN) +
                   analogRead(MIC_PIN) + analogRead(MIC_PIN)) >> 2;
        int centered = raw - dc;

        if (centered >  2047) centered =  2047;
        if (centered < -2048) centered = -2048;

        audio_buffer[i] = (int16_t)(centered * 16);
        delayMicroseconds(SAMPLE_DELAY_US);
    }
}

// ══════════════════════════════════════════════
// ─── Analysis helpers ─────────────────────────

float getAvgHR() {
    float sum = 0;
    int count = 0;
    for (int i = 0; i < 10; i++) {
        if (hr_buffer[i] > 0) { sum += hr_buffer[i]; count++; }
    }
    return count > 0 ? sum / count : 0;
}

float getPeakAccelG() {
    float peak = 0;
    for (int i = 0; i < 200; i++) {
        float mag = sqrt(
            imu_buffer[i][0] * imu_buffer[i][0] +
            imu_buffer[i][1] * imu_buffer[i][1] +
            imu_buffer[i][2] * imu_buffer[i][2]
        );
        if (mag > peak) peak = mag;
    }
    return peak;
}

float getPeakGyroMag() {
    float peak = 0;
    for (int i = 0; i < 200; i++) {
        float mag = sqrt(
            imu_buffer[i][3] * imu_buffer[i][3] +
            imu_buffer[i][4] * imu_buffer[i][4] +
            imu_buffer[i][5] * imu_buffer[i][5]
        );
        if (mag > peak) peak = mag;
    }
    return peak;
}

float getAudioRMS() {
    double sumSq = 0;
    for (int i = 0; i < 15360; i++) {
        float s = audio_buffer[i] / 32768.0;
        sumSq += s * s;
    }
    return sqrt(sumSq / 15360.0);
}

// ══════════════════════════════════════════════
// printAnalysis — Serial report, called each window
// ══════════════════════════════════════════════
void printAnalysis() {
    float avgHR     = getAvgHR();
    float peakAccel = getPeakAccelG();
    float peakGyro  = getPeakGyroMag();
    float audioRMS  = getAudioRMS();

    bool hrAlarm    = false;
    bool spo2Alarm  = false;
    bool fallAlarm  = false;
    bool audioAlarm = false;

    Serial.println("---BEGIN_ANALYSIS---");
    Serial.println();
    Serial.println("==== SENSOR ANALYSIS REPORT ====");
    Serial.println();

    // ── Heart Rate ──────────────────────────────
    Serial.print("[ HEART RATE ]  Avg: ");
    Serial.print(avgHR, 1);
    Serial.println(" BPM");

    if (avgHR == 0) {
        Serial.println("  Status : NO DATA  – sensor not detected or no beats found.");
        hrAlarm = true;
    } else if (avgHR < 50) {
        Serial.println("  Status : WARNING  – Bradycardia (< 50 BPM). Abnormally low heart rate.");
        hrAlarm = true;
    } else if (avgHR <= 100) {
        Serial.println("  Status : NORMAL   – Within healthy resting range (50–100 BPM).");
    } else if (avgHR <= 150) {
        Serial.println("  Status : ELEVATED – Tachycardia or high physical activity (100–150 BPM).");
        hrAlarm = true;
    } else {
        Serial.println("  Status : CRITICAL – Severe tachycardia (> 150 BPM). Medical attention advised.");
        hrAlarm = true;
    }
    Serial.println();

    // ── SpO2 ────────────────────────────────────
    Serial.print("[ SPO2 ]        Value: ");
    Serial.print(spo2_value);
    Serial.println(" %");

    if (spo2_value >= 95) {
        Serial.println("  Status : NORMAL   – Healthy oxygen saturation (>= 95%).");
    } else if (spo2_value >= 90) {
        Serial.println("  Status : WARNING  – Mild hypoxia (90–94%). Monitor closely.");
        spo2Alarm = true;
    } else {
        Serial.println("  Status : CRITICAL – Severe hypoxia (< 90%). Immediate attention required.");
        spo2Alarm = true;
    }
    Serial.println();

    // ── Motion / Fall Detection ──────────────────
    Serial.print("[ MOTION ]      Peak accel: ");
    Serial.print(peakAccel, 2);
    Serial.print(" g  |  Peak gyro: ");
    Serial.print(peakGyro, 1);
    Serial.println(" deg/s");

    if (peakAccel > 3.0 && peakGyro > 300.0) {
        Serial.println("  Status : FALL DETECTED – High acceleration + rotation spike detected.");
        Serial.print  ("           Accel threshold: > 3.0 g  (measured: "); Serial.print(peakAccel, 2); Serial.println(" g)");
        Serial.print  ("           Gyro  threshold: > 300 deg/s (measured: "); Serial.print(peakGyro, 1); Serial.println(" deg/s)");
        fallAlarm = true;
    } else if (peakAccel > 2.0) {
        Serial.println("  Status : ELEVATED MOTION – Brisk movement or minor impact. No fall confirmed.");
    } else {
        Serial.println("  Status : CALM       – Normal movement range (< 2 g peak).");
    }
    Serial.println();

    // ── Audio ────────────────────────────────────
    Serial.print("[ AUDIO ]       RMS level: ");
    Serial.println(audioRMS, 4);

    if (audioRMS > 0.15) {
        Serial.println("  Status : LOUD EVENT – Sustained high-amplitude sound detected.");
        Serial.println("           Possible screaming or distress audio. Threshold: RMS > 0.15");
        audioAlarm = true;
    } else if (audioRMS > 0.05) {
        Serial.println("  Status : MODERATE   – Normal ambient / conversational audio level.");
    } else {
        Serial.println("  Status : QUIET      – Low ambient noise. No distress audio detected.");
    }
    Serial.println();

    // ── Overall Verdict ──────────────────────────
    Serial.println("================================");
    bool unsafe = hrAlarm || spo2Alarm || fallAlarm || audioAlarm;

    if (unsafe) {
        Serial.println(">> OVERALL STATUS : *** UNSAFE ***");
        Serial.println();
        Serial.println("   Triggered flags:");
        if (hrAlarm)    Serial.println("   [!] Heart rate out of safe range");
        if (spo2Alarm)  Serial.println("   [!] Low blood oxygen (SpO2)");
        if (fallAlarm)  Serial.println("   [!] Fall / violent motion detected");
        if (audioAlarm) Serial.println("   [!] Distress audio detected");
        Serial.println();
        Serial.println("   Action: Alert contacts / emergency services.");
    } else {
        Serial.println(">> OVERALL STATUS :    SAFE");
        Serial.println();
        Serial.println("   All parameters within normal limits.");
        Serial.println("   HR normal | SpO2 normal | No fall | No distress audio.");
    }

    Serial.println("================================");
    Serial.println("---END_ANALYSIS---");
}

// ══════════════════════════════════════════════
// WiFi reconnect — non-blocking 10 s timeout
// ══════════════════════════════════════════════
void reconnectWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;

    Serial.print("WiFi lost — reconnecting");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 10000UL) {
        delay(500);
        Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED)
        Serial.println("\nReconnected.");
    else
        Serial.println("\nReconnect failed — will retry next window.");
}

// ══════════════════════════════════════════════
// Chunked HTTP helpers
// ══════════════════════════════════════════════
static void flushChunk() {
    if (!g_client || chunkLen == 0) return;
    g_client->printf("%X\r\n", chunkLen);
    g_client->write((const uint8_t*)chunkBuf, chunkLen);
    g_client->print("\r\n");
    chunkLen = 0;
}

static inline void emitChar(char c) {
    chunkBuf[chunkLen++] = c;
    if (chunkLen == CHUNK_BUF_SIZE) flushChunk();
}

static void emitStr(const char* s) {
    while (*s) emitChar(*s++);
}

static void emitFloat(float v, int decimals) {
    char tmp[32];
    dtostrf(v, 1, decimals, tmp);
    emitStr(tmp);
}

// ══════════════════════════════════════════════
// sendPayloadChunked — HTTP/1.1 chunked POST
//
// WHY CHUNKED?
//   Audio alone is 15 360 floats × ~8 chars ≈ 123 KB of text.
//   Total payload ≈ 135–140 KB. Allocating that as a String or
//   StaticJsonDocument would exhaust the ESP32-S3 heap and crash.
//   Chunked transfer streams the body in CHUNK_BUF_SIZE pieces,
//   keeping heap usage constant regardless of payload size.
//
// BACKEND NOTE:
//   Your server must accept Transfer-Encoding: chunked (all
//   HTTP/1.1 servers do — FastAPI/uvicorn, Flask, Node, etc.).
//   The JSON schema sent is identical to the original printPayload:
//     { "hr_bpm":[...], "spo2":NNN, "imu":[[...]], 
//       "audio_pcm":[...], "device_id":"assn_001" }
// ══════════════════════════════════════════════
void sendPayloadChunked() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[POST] Skipping — no WiFi.");
        return;
    }

    // ── Parse host, port, path from BACKEND_URL ───────────────
    // Expects: "http://host[:port]/path"
    String url        = String(BACKEND_URL);
    int    schemeEnd  = url.indexOf("://");
    String hostAndPath = (schemeEnd >= 0) ? url.substring(schemeEnd + 3) : url;
    int    slashPos   = hostAndPath.indexOf('/');
    String host       = (slashPos >= 0) ? hostAndPath.substring(0, slashPos) : hostAndPath;
    String path       = (slashPos >= 0) ? hostAndPath.substring(slashPos)    : String("/");

    int port     = 80;
    int colonPos = host.indexOf(':');
    if (colonPos >= 0) {
        port = host.substring(colonPos + 1).toInt();
        host = host.substring(0, colonPos);
    }

    // ── Open TCP connection ────────────────────────────────────
    WiFiClient client;
    if (!client.connect(host.c_str(), port)) {
        Serial.printf("[POST] Connection failed to %s:%d\n", host.c_str(), port);
        return;
    }

    // ── HTTP request headers ───────────────────────────────────
    client.printf("POST %s HTTP/1.1\r\n",           path.c_str());
    client.printf("Host: %s\r\n",                   host.c_str());
    client.printf("Content-Type: application/json\r\n");
    client.printf("X-API-Key: %s\r\n",              API_KEY);
    client.printf("Transfer-Encoding: chunked\r\n");
    client.printf("Connection: close\r\n");
    client.printf("\r\n");

    // ── Stream JSON body ───────────────────────────────────────
    g_client = &client;
    chunkLen  = 0;

    // hr_bpm
    emitStr("{\"hr_bpm\":[");
    for (int i = 0; i < 10; i++) {
        emitFloat(hr_buffer[i], 1);
        if (i < 9) emitChar(',');
    }

    // spo2
    emitStr("],\"spo2\":");
    {
        char tmp[8];
        itoa(spo2_value, tmp, 10);
        emitStr(tmp);
    }

    // imu — chronological replay from circular buffer
    emitStr(",\"imu\":[");
    for (int i = 0; i < 200; i++) {
        int idx = (imu_index - 200 + i + 200) % 200;
        emitChar('[');
        for (int j = 0; j < 6; j++) {
            emitFloat(imu_buffer[idx][j], 3);
            if (j < 5) emitChar(',');
        }
        emitChar(']');
        if (i < 199) emitChar(',');
    }

    // audio_pcm + device_id
    emitStr("],\"audio_pcm\":[");
    for (int i = 0; i < 15360; i++) {
        emitFloat(audio_buffer[i] / 32768.0f, 4);
        if (i < 15359) emitChar(',');
    }
    emitStr("],\"device_id\":\"assn_001\"}");

    // Flush remainder + HTTP terminal zero-chunk
    flushChunk();
    client.print("0\r\n\r\n");

    // ── Read server response ───────────────────────────────────
    unsigned long timeout = millis();
    while (client.connected() && !client.available()) {
        if (millis() - timeout > 5000UL) {
            Serial.println("[POST] Timeout waiting for response.");
            client.stop();
            g_client = nullptr;
            return;
        }
    }

    if (client.available()) {
        String statusLine = client.readStringUntil('\n');
        Serial.printf("[POST] %s\n", statusLine.c_str());
    }

    client.stop();
    g_client = nullptr;
    Serial.println("[POST] Done.");
}
