import { RATE_LIMIT_MAX, RATE_LIMIT_STORAGE_KEY, RATE_LIMIT_WINDOW } from './constants';

export function checkRateLimit(): boolean {
  const rateLimit = getRateLimit();
  const now = Date.now();

  // Clean old entries
  const recentRequests = rateLimit.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }

  return true;
}

export function incrementRateLimit(): void {
  const rateLimit = getRateLimit();
  const now = Date.now();

  // Clean old entries and add new one
  const recentRequests = rateLimit.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);
  recentRequests.push(now);

  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(recentRequests));
}

export function getRateLimit(): number[] {
  const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function updateRateLimitDisplay(): void {
  const rateLimit = getRateLimit();
  const now = Date.now();
  const recentRequests = rateLimit.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);

  const remaining = RATE_LIMIT_MAX - recentRequests.length;
  const infoElement = document.getElementById('rate-limit-info');

  if (!infoElement) return;

  if (remaining <= 0) {
    const oldestRequest = Math.min(...recentRequests);
    const resetTime = new Date(oldestRequest + RATE_LIMIT_WINDOW);
    infoElement.textContent = `Rate limit reached. Try again at ${resetTime.toLocaleTimeString()}`;
    infoElement.classList.remove('hidden');
  } else if (remaining <= 3) {
    infoElement.textContent = `${remaining} AI generations remaining this hour`;
    infoElement.classList.remove('hidden');
  } else {
    infoElement.classList.add('hidden');
  }
}
