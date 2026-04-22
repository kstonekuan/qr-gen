export type TabType = 'upload' | 'generate';

export function parseTabType(raw: string | undefined): TabType | null {
  return raw === 'upload' || raw === 'generate' ? raw : null;
}

// QR rendering domain types — all values are parsed at the DOM boundary in main.ts
// so rendering code can trust them without re-validation.

export type LogoArea =
  | { kind: 'none' }
  | { kind: 'present'; logoSizeRatio: number; borderSizePercent: number };

export type IconRender = {
  src: string;
  sizeRatio: number;
  border: { kind: 'none' } | { kind: 'opaque'; sizePercent: number };
  corners: { kind: 'sharp' } | { kind: 'rounded'; radiusPercent: number };
};

export type QRCodeFormConfig = {
  text: string;
  moduleSize: number;
  finderRoundingPercent: number;
  moduleRoundingPercent: number;
  icon: IconRender | null;
};

export type ValidationResult =
  | { kind: 'valid'; decodedText: string }
  | { kind: 'invalid'; error: string };
