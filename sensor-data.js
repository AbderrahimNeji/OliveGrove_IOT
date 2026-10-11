'use strict';

const TEMP_MIN = -40;
const TEMP_MAX = 80;
const PCT_MIN = 0;
const PCT_MAX = 100;
const RAIN_MM_MAX = 500;
const HISTORY_DEFAULT = 50;
const HISTORY_MAX = 100;

function readNumber(body, field) {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === '') {
    return { missing: true };
  }
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value)) {
    return { error: `${field} must be a finite number` };
  }
  return { value };
}

function inRange(value, min, max, field) {
  if (value < min || value > max) {
    return `${field} must be between ${min} and ${max}`;
  }
  return null;
}

/**
 * Normalize and validate a sensor JSON payload from the dashboard / Arduino bridge.
 * Required: temp_c, soil_pct, rain_pct.
 */
function parseSensorPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const temp = readNumber(body, 'temp_c');
  if (temp.missing) return { ok: false, error: 'temp_c is required' };
  if (temp.error) return { ok: false, error: temp.error };
  const tempRange = inRange(temp.value, TEMP_MIN, TEMP_MAX, 'temp_c');
  if (tempRange) return { ok: false, error: tempRange };

  const soil = readNumber(body, 'soil_pct');
  if (soil.missing) return { ok: false, error: 'soil_pct is required' };
  if (soil.error) return { ok: false, error: soil.error };
  const soilRange = inRange(soil.value, PCT_MIN, PCT_MAX, 'soil_pct');
  if (soilRange) return { ok: false, error: soilRange };

  const rain = readNumber(body, 'rain_pct');
  if (rain.missing) return { ok: false, error: 'rain_pct is required' };
  if (rain.error) return { ok: false, error: rain.error };
  const rainRange = inRange(rain.value, PCT_MIN, PCT_MAX, 'rain_pct');
  if (rainRange) return { ok: false, error: rainRange };

  const data = {
    temp_c: temp.value,
    soil_pct: soil.value,
    rain_pct: rain.value,
    humidite_pct: rain.value,
    pluie_mm: rain.value * 0.1,
    code_meteo_dominant: 3,
  };

  const humidity = readNumber(body, 'humidite_pct');
  if (humidity.error) return { ok: false, error: humidity.error };
  if (!humidity.missing) {
    const humidityRange = inRange(humidity.value, PCT_MIN, PCT_MAX, 'humidite_pct');
    if (humidityRange) return { ok: false, error: humidityRange };
    data.humidite_pct = humidity.value;
  }

  const rainMm = readNumber(body, 'pluie_mm');
  if (rainMm.error) return { ok: false, error: rainMm.error };
  if (!rainMm.missing) {
    const rainMmRange = inRange(rainMm.value, 0, RAIN_MM_MAX, 'pluie_mm');
    if (rainMmRange) return { ok: false, error: rainMmRange };
    data.pluie_mm = rainMm.value;
  }

  const weather = readNumber(body, 'code_meteo_dominant');
  if (weather.error) return { ok: false, error: weather.error };
  if (!weather.missing) {
    if (!Number.isInteger(weather.value) || weather.value < 0 || weather.value > 99) {
      return { ok: false, error: 'code_meteo_dominant must be an integer between 0 and 99' };
    }
    data.code_meteo_dominant = weather.value;
  }

  if (typeof body.timestamp === 'string' && body.timestamp.trim()) {
    data.timestamp = body.timestamp.trim();
  }
  const soilRaw = readNumber(body, 'soil_raw');
  if (!soilRaw.missing && !soilRaw.error) data.soil_raw = soilRaw.value;
  const rainRaw = readNumber(body, 'rain_raw');
  if (!rainRaw.missing && !rainRaw.error) data.rain_raw = rainRaw.value;
  const rainDo = readNumber(body, 'rain_do');
  if (!rainDo.missing && !rainDo.error) data.rain_do = rainDo.value;

  return { ok: true, data };
}

function parseHistoryLimit(raw, fallback = HISTORY_DEFAULT, max = HISTORY_MAX) {
  const value = parseInt(raw, 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(1, value));
}

module.exports = {
  parseSensorPayload,
  parseHistoryLimit,
  TEMP_MIN,
  TEMP_MAX,
  HISTORY_MAX,
};
