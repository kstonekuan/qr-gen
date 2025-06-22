// Rate limiting constants
export const RATE_LIMIT_STORAGE_KEY = 'gemini_rate_limit';
export const RATE_LIMIT_MAX = 60; // Max requests per hour
export const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

// Storage keys
export const API_KEY_STORAGE_KEY = 'gemini_api_key';
export const GEMINI_PROMPT_STORAGE_KEY = 'gemini_system_prompt';

// UI constants
export const MIN_QR_SIZE = 200;
export const MAX_QR_SIZE = 500;
export const DEFAULT_QR_SIZE = 300;

// Gemini constants
export const DEFAULT_GEMINI_PROMPT = `You are an icon designer for QR codes. Given a user prompt, analyze it and return JSON data for creating a simple, clear icon suitable for QR code centers.

Guidelines:
1. Choose the most appropriate shape (circle, square, triangle, or rounded) that best represents the concept
2. Select a vibrant, meaningful color that relates to the subject
3. Create a 1-3 character abbreviation that captures the essence of the prompt
4. For complex concepts, you may optionally provide SVG path data

Examples of good responses:
- "wifi network" → shape: circle, color: #2196F3 (blue), label: WiF
- "restaurant/food" → shape: rounded, color: #FF5722 (orange), label: EAT
- "emergency/alert" → shape: triangle, color: #F44336 (red), label: SOS
- "nature/eco" → shape: circle, color: #4CAF50 (green), label: ECO
- "email" → shape: square, color: #9C27B0 (purple), label: @
- "phone" → shape: rounded, color: #00BCD4 (cyan), label: TEL

The icon must be:
- Simple and recognizable at small sizes
- High contrast for QR code scanning
- Modern and minimalist in design

User prompt: {prompt}`;
