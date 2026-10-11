'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseSensorPayload,
  parseHistoryLimit,
  HISTORY_MAX,
} = require('./sensor-data');

const valid = {
  temp_c: 24.5,
  soil_pct: 42,
  rain_pct: 10,
};

test('accepts a complete Arduino payload and keeps optional fields', () => {
  const result = parseSensorPayload({
    ...valid,
    humidite_pct: 10,
    pluie_mm: 1,
    code_meteo_dominant: 61,
    timestamp: '2026-10-11T13:00:00.000Z',
    soil_raw: 2000,
    rain_raw: 1000,
    rain_do: 0,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.temp_c, 24.5);
  assert.equal(result.data.soil_pct, 42);
  assert.equal(result.data.rain_pct, 10);
  assert.equal(result.data.humidite_pct, 10);
  assert.equal(result.data.pluie_mm, 1);
  assert.equal(result.data.code_meteo_dominant, 61);
  assert.equal(result.data.timestamp, '2026-10-11T13:00:00.000Z');
  assert.equal(result.data.soil_raw, 2000);
});

test('parses numeric strings from JSON-like input', () => {
  const result = parseSensorPayload({
    temp_c: '18',
    soil_pct: '55.0',
    rain_pct: '0',
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.temp_c, 18);
  assert.equal(result.data.humidite_pct, 0);
  assert.equal(result.data.pluie_mm, 0);
});

test('rejects missing required fields', () => {
  assert.equal(parseSensorPayload({ soil_pct: 10, rain_pct: 10 }).ok, false);
  assert.equal(parseSensorPayload({ temp_c: 10, rain_pct: 10 }).ok, false);
  assert.equal(parseSensorPayload({ temp_c: 10, soil_pct: 10 }).ok, false);
  assert.equal(parseSensorPayload(null).ok, false);
  assert.equal(parseSensorPayload([]).ok, false);
});

test('rejects out-of-range and non-numeric readings', () => {
  assert.match(
    parseSensorPayload({ ...valid, temp_c: 120 }).error,
    /temp_c/,
  );
  assert.match(
    parseSensorPayload({ ...valid, soil_pct: -1 }).error,
    /soil_pct/,
  );
  assert.match(
    parseSensorPayload({ ...valid, rain_pct: 101 }).error,
    /rain_pct/,
  );
  assert.match(
    parseSensorPayload({ ...valid, temp_c: 'hot' }).error,
    /temp_c/,
  );
  assert.match(
    parseSensorPayload({ ...valid, temp_c: Infinity }).error,
    /temp_c/,
  );
});

test('clamps history limit to a safe range', () => {
  assert.equal(parseHistoryLimit(undefined), 50);
  assert.equal(parseHistoryLimit('10'), 10);
  assert.equal(parseHistoryLimit('0'), 1);
  assert.equal(parseHistoryLimit('-5'), 1);
  assert.equal(parseHistoryLimit('9999'), HISTORY_MAX);
  assert.equal(parseHistoryLimit('nope'), 50);
});
