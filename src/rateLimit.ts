import { RATE_LIMIT_MAX, RATE_LIMIT_STORAGE_KEY, RATE_LIMIT_WINDOW_MS } from './constants';

// Pure helpers — tested in isolation.

export function parseStoredTimestamps(raw: string | null): number[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );
}

export function filterRecent(
  timestamps: readonly number[],
  now: number,
  windowMs: number,
): number[] {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

// Thin wrappers around localStorage + Date.now.

function loadTimestamps(): number[] {
  return parseStoredTimestamps(localStorage.getItem(RATE_LIMIT_STORAGE_KEY));
}

export function checkRateLimit(): boolean {
  const recent = filterRecent(loadTimestamps(), Date.now(), RATE_LIMIT_WINDOW_MS);
  return recent.length < RATE_LIMIT_MAX;
}

export function incrementRateLimit(): void {
  const now = Date.now();
  const recent = filterRecent(loadTimestamps(), now, RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(recent));
}

export function updateRateLimitDisplay(): void {
  const recent = filterRecent(loadTimestamps(), Date.now(), RATE_LIMIT_WINDOW_MS);
  const remaining = RATE_LIMIT_MAX - recent.length;
  const infoElement = document.getElementById('rate-limit-info');
  if (!infoElement) return;

  if (remaining <= 0) {
    const oldestRequest = Math.min(...recent);
    const resetTime = new Date(oldestRequest + RATE_LIMIT_WINDOW_MS);
    infoElement.textContent = `Rate limit reached. Try again at ${resetTime.toLocaleTimeString()}`;
    infoElement.classList.remove('hidden');
  } else if (remaining <= 3) {
    infoElement.textContent = `${remaining} AI generations remaining this hour`;
    infoElement.classList.remove('hidden');
  } else {
    infoElement.classList.add('hidden');
  }
}
