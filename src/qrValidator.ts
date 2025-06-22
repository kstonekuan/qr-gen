import jsQR from 'jsqr';

export async function validateQRCode(canvas: HTMLCanvasElement): Promise<{
  isValid: boolean;
  decodedText?: string;
  error?: string;
}> {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { isValid: false, error: 'Could not get canvas context' };
    }

    // Get image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Try to decode the QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      return {
        isValid: true,
        decodedText: code.data,
      };
    }
    return {
      isValid: false,
      error: 'QR code could not be read. Try reducing logo size or enabling the border.',
    };
  } catch (_error) {
    return {
      isValid: false,
      error: 'Error validating QR code',
    };
  }
}
