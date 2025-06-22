import QRCode from 'qrcode';
import { validateQRCode } from './qrValidator';
import type { QRCodeOptions } from './types';

export async function generateQRCode(
  text: string,
  size: number,
  iconSrc: string | null,
): Promise<void> {
  const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const options: QRCodeOptions = {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H', // High error correction (30% damage tolerance)
  };

  try {
    // Generate QR code
    await QRCode.toCanvas(canvas, text, options);

    // Add icon if available
    if (iconSrc) {
      const transparentBg =
        (document.getElementById('transparent-bg') as HTMLInputElement)?.checked || false;
      const logoSize =
        Number.parseInt((document.getElementById('logo-size') as HTMLInputElement)?.value || '20') /
        100;
      const borderSize = Number.parseInt(
        (document.getElementById('border-size') as HTMLInputElement)?.value || '5',
      );
      await addIconToQRCode(canvas, iconSrc, transparentBg, logoSize, borderSize);

      // Validate the QR code after adding the icon
      const validation = await validateQRCode(canvas);
      if (!validation.isValid) {
        // Add a warning indicator
        const warningDiv = document.getElementById('qr-warning');
        if (warningDiv) {
          warningDiv.classList.remove('hidden');
          warningDiv.textContent = validation.error || 'QR code may not scan properly';
        }
      } else {
        // Hide warning if previously shown
        const warningDiv = document.getElementById('qr-warning');
        if (warningDiv) {
          warningDiv.classList.add('hidden');
        }
      }
    }

    // Show canvas and download button
    canvas.classList.remove('hidden');
    const downloadButton = document.getElementById('download-qr');
    if (downloadButton) {
      downloadButton.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Error generating QR code. Please try again.');
  }
}

function addIconToQRCode(
  canvas: HTMLCanvasElement,
  iconSrc: string,
  transparentBg = false,
  logoSizeRatio = 0.2,
  borderSizePercentage = 5, // Renamed from borderSize
): Promise<void> {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve();
      return;
    }

    const img = new Image();

    img.onload = async () => {
      const iconSize = canvas.width * logoSizeRatio;
      const iconX = (canvas.width - iconSize) / 2;
      const iconY = (canvas.height - iconSize) / 2;

      // Calculate actual border size in pixels
      const borderSizeInPixels = (iconSize * borderSizePercentage) / 100;

      // Only add background if not using transparent background
      if (!transparentBg && borderSizeInPixels > 0) {
        ctx.save();

        // Dynamic border radius, proportional to border size
        // Max radius can be, for example, 20% of borderSizeInPixels or a portion of iconSize
        const borderRadius = Math.min(borderSizeInPixels * 0.5, iconSize * 0.1, 8); // Capped at 8px max for very large icons/borders
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(
          iconX - borderSizeInPixels,
          iconY - borderSizeInPixels,
          iconSize + borderSizeInPixels * 2,
          iconSize + borderSizeInPixels * 2,
          borderRadius,
        );
        ctx.fill();

        ctx.restore();
      }

      // Draw icon with transparency support
      ctx.drawImage(img, iconX, iconY, iconSize, iconSize);

      // Give the browser a moment to update the canvas
      setTimeout(() => resolve(), 50);
    };

    img.onerror = () => {
      resolve();
    };

    img.src = iconSrc;
  });
}

export function downloadQRCode(): void {
  const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = canvas.toDataURL();
  link.click();
}
