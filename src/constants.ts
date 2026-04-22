// Rate limiting constants
export const RATE_LIMIT_STORAGE_KEY = 'gemini_rate_limit';
export const RATE_LIMIT_MAX = 60;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// Storage keys
export const API_KEY_STORAGE_KEY = 'gemini_api_key';
export const GEMINI_PROMPT_STORAGE_KEY = 'gemini_system_prompt';
export const GEMINI_MODEL_STORAGE_KEY = 'gemini_model';

// QR input ranges + defaults — single source of truth for HTML and parsing fallbacks.
export const QR_INPUT = {
  squareSize: { min: 6, max: 14, default: 10 },
  finderRounding: { min: 0, max: 50, default: 0 },
  moduleRounding: { min: 0, max: 50, default: 0 },
  logoSize: { min: 10, max: 30, default: 20 },
  borderSize: { min: 0, max: 10, default: 5 },
  cornerRadius: { min: 0, max: 50, default: 25 },
} as const;

// Gemini constants
export const DEFAULT_GEMINI_MODEL = 'gemini-3-flash';

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

Create an appropriate SVG path icon for: {prompt}`;
