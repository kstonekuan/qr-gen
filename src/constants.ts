// Rate limiting constants
export const RATE_LIMIT_STORAGE_KEY = 'gemini_rate_limit';
export const RATE_LIMIT_MAX = 60; // Max requests per hour
export const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

// Storage keys
export const API_KEY_STORAGE_KEY = 'gemini_api_key';
export const GEMINI_PROMPT_STORAGE_KEY = 'gemini_system_prompt';
export const GEMINI_MODEL_STORAGE_KEY = 'gemini_model';

// UI constants
export const MIN_QR_SIZE = 200;
export const MAX_QR_SIZE = 500;
export const DEFAULT_QR_SIZE = 300;

// Gemini constants
export const DEFAULT_GEMINI_PROMPT = `You are an SVG icon designer. Given a user prompt, create a simple, minimalist SVG icon suitable for QR code centers.

Return JSON with:
1. svgPath: The main SVG path data for the icon (required)
2. color: A single color for the icon (default: #000000)
3. viewBox: The viewBox dimensions (default: "0 0 24 24")

Guidelines:
- Design simple, bold icons that work at small sizes
- Use a single color (no gradients)
- Icons should be centered in the viewBox
- Use filled shapes, not outlines
- Keep detail minimal for QR code clarity

Examples of good SVG paths:
- "wifi" → M12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z M12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z M2.93 5.34C5.05 3.22 8.32 2 12 2s6.95 1.22 9.07 3.34l-1.41 1.41C17.92 5.01 15.17 4 12 4s-5.92 1.01-7.66 2.75L2.93 5.34z
- "email" → M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z
- "phone" → M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z
- "shopping cart" → M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z
- "home" → M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z
- "settings" → M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z

Create an appropriate SVG path icon for: {prompt}`;
