export interface RateLimitEntry {
  timestamp: number;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface IconDescription {
  shape: string;
  color: string;
  label: string;
}

export type TabType = 'upload' | 'generate';

export interface QRCodeOptions {
  width: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}
