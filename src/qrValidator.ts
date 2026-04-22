import jsQR from 'jsqr';
import type { ValidationResult } from './types';

export async function validateQRCode(canvas: HTMLCanvasElement): Promise<ValidationResult> {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return { kind: 'invalid', error: 'Could not get canvas context' };
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      return { kind: 'valid', decodedText: code.data };
    }
    return {
      kind: 'invalid',
      error: 'QR code could not be read. Try reducing logo size or enabling the border.',
    };
  } catch {
    return { kind: 'invalid', error: 'Error validating QR code' };
  }
}
