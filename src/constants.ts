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

Create an appropriate SVG path icon for: {prompt}`;
