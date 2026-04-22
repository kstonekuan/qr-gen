import { describe, expect, it } from 'vitest';
import { filterRecent, parseStoredTimestamps } from './rateLimit';

describe('parseStoredTimestamps', () => {
  it('returns an empty array when the raw value is null', () => {
    expect(parseStoredTimestamps(null)).toEqual([]);
  });

  it('returns an empty array when JSON is malformed', () => {
    expect(parseStoredTimestamps('not-json')).toEqual([]);
  });

  it('returns an empty array when the parsed value is not an array', () => {
    expect(parseStoredTimestamps('{"a":1}')).toEqual([]);
    expect(parseStoredTimestamps('42')).toEqual([]);
  });

  it('drops non-finite and non-number values', () => {
    expect(parseStoredTimestamps('[1, "2", null, 3, true, 4.5]')).toEqual([1, 3, 4.5]);
  });

  it('returns numeric timestamps verbatim', () => {
    expect(parseStoredTimestamps('[1000, 2000, 3000]')).toEqual([1000, 2000, 3000]);
  });
});

describe('filterRecent', () => {
  const windowMs = 60 * 60 * 1000;
  const now = 10_000_000;

  it('keeps timestamps within the window', () => {
    const timestamps = [now - 10, now - windowMs + 1];
    expect(filterRecent(timestamps, now, windowMs)).toEqual(timestamps);
  });

  it('drops timestamps exactly at or before the window boundary', () => {
    const atBoundary = now - windowMs;
    const beforeBoundary = now - windowMs - 1;
    expect(filterRecent([atBoundary, beforeBoundary], now, windowMs)).toEqual([]);
  });

  it('returns an empty array when all timestamps are stale', () => {
    expect(filterRecent([now - windowMs - 1], now, windowMs)).toEqual([]);
  });
});
