import QRCode from 'qrcode';
import { validateQRCode } from './qrValidator';
import type { QRCodeOptions } from './types';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function isInFinderPattern(row: number, col: number, moduleCount: number): boolean {
  // Top-left finder pattern (7x7)
  if (row < 7 && col < 7) return true;
  // Top-right finder pattern (7x7)
  if (row < 7 && col >= moduleCount - 7) return true;
  // Bottom-left finder pattern (7x7)
  if (row >= moduleCount - 7 && col < 7) return true;
  return false;
}

function isInLogoArea(
  row: number,
  col: number,
  moduleCount: number,
  marginModules: number,
  logoSizeRatio: number,
  borderSizePercent: number,
): boolean {
  // Calculate in the same coordinate system as addIconToQRCode
  // addIconToQRCode uses canvas.width which includes margin
  const totalSize = moduleCount + marginModules * 2;
  const logoModules = totalSize * logoSizeRatio;
  const borderModules = logoModules * (borderSizePercent / 100);
  const totalLogoModules = logoModules + borderModules * 2;

  // Center position relative to data area (excluding margin)
  const centerModule = moduleCount / 2;
  const halfLogoModules = totalLogoModules / 2;

  // Floor start and ceil end to ensure symmetric clearing that fully covers the icon
  const startModule = Math.floor(centerModule - halfLogoModules);
  const endModule = Math.ceil(centerModule + halfLogoModules);

  return row >= startModule && row < endModule && col >= startModule && col < endModule;
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  moduleSize: number,
  finderRoundingPercent: number,
): void {
  const size7 = moduleSize * 7;
  const size5 = moduleSize * 5;
  const size3 = moduleSize * 3;

  // Calculate radius based on the outer size for consistent look
  const outerRadius = (size7 / 2) * (finderRoundingPercent / 50);
  const middleRadius = (size5 / 2) * (finderRoundingPercent / 50);
  const innerRadius = (size3 / 2) * (finderRoundingPercent / 50);

  // Outer black square (7x7)
  ctx.fillStyle = '#000000';
  drawRoundedRect(ctx, x, y, size7, size7, outerRadius);

  // Middle white square (5x5)
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, x + moduleSize, y + moduleSize, size5, size5, middleRadius);

  // Inner black square (3x3)
  ctx.fillStyle = '#000000';
  drawRoundedRect(ctx, x + moduleSize * 2, y + moduleSize * 2, size3, size3, innerRadius);
}

interface LogoAreaConfig {
  hasLogo: boolean;
  logoSizeRatio: number;
  borderSizePercent: number;
}

function renderRoundedQR(
  canvas: HTMLCanvasElement,
  qrData: ReturnType<typeof QRCode.create>,
  moduleSize: number,
  marginModules: number,
  finderRoundingPercent: number,
  moduleRoundingPercent: number,
  logoArea: LogoAreaConfig = { hasLogo: false, logoSizeRatio: 0, borderSizePercent: 0 },
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const moduleCount = qrData.modules.size;
  // moduleSize is now an integer from the slider, so all calculations are clean
  const margin = moduleSize * marginModules;
  const canvasSize = moduleSize * (moduleCount + marginModules * 2);
  const moduleRadius = (moduleSize / 2) * (moduleRoundingPercent / 50);

  canvas.width = canvasSize;
  canvas.height = canvasSize;

  // Fill background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Draw finder patterns as whole rounded shapes
  // Top-left
  drawFinderPattern(ctx, margin, margin, moduleSize, finderRoundingPercent);
  // Top-right
  drawFinderPattern(
    ctx,
    margin + (moduleCount - 7) * moduleSize,
    margin,
    moduleSize,
    finderRoundingPercent,
  );
  // Bottom-left
  drawFinderPattern(
    ctx,
    margin,
    margin + (moduleCount - 7) * moduleSize,
    moduleSize,
    finderRoundingPercent,
  );

  // Draw data modules (skip finder pattern areas and logo area)
  ctx.fillStyle = '#000000';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder pattern areas
      if (isInFinderPattern(row, col, moduleCount)) continue;

      // Skip logo area if logo is present
      if (
        logoArea.hasLogo &&
        isInLogoArea(
          row,
          col,
          moduleCount,
          marginModules,
          logoArea.logoSizeRatio,
          logoArea.borderSizePercent,
        )
      ) {
        continue;
      }

      if (qrData.modules.get(row, col)) {
        // All positions are now clean integers (no rounding needed)
        const x = margin + col * moduleSize;
        const y = margin + row * moduleSize;

        if (moduleRadius > 0) {
          drawRoundedRect(ctx, x, y, moduleSize, moduleSize, moduleRadius);
        } else {
          ctx.fillRect(x, y, moduleSize, moduleSize);
        }
      }
    }
  }
}

export async function generateQRCode(
  text: string,
  moduleSize: number,
  iconSrc: string | null,
): Promise<void> {
  const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const finderRoundingPercent = Number.parseInt(
    (document.getElementById('finder-rounding') as HTMLInputElement)?.value || '0',
    10,
  );
  const moduleRoundingPercent = Number.parseInt(
    (document.getElementById('module-rounding') as HTMLInputElement)?.value || '0',
    10,
  );

  const marginModules = 2;

  // Get logo settings upfront (needed for both QR generation and icon addition)
  const logoSizeRatio =
    Number.parseInt((document.getElementById('logo-size') as HTMLInputElement)?.value || '20', 10) /
    100;
  const borderSizePercent = Number.parseInt(
    (document.getElementById('border-size') as HTMLInputElement)?.value || '5',
    10,
  );
  const transparentBg =
    (document.getElementById('transparent-bg') as HTMLInputElement)?.checked || false;
  const roundedCorners =
    (document.getElementById('logo-rounded') as HTMLInputElement)?.checked || false;
  const cornerRadiusPercent = Number.parseInt(
    (document.getElementById('corner-radius') as HTMLInputElement)?.value || '15',
    10,
  );

  try {
    // Generate QR data to get module count
    const qrData = QRCode.create(text, { errorCorrectionLevel: 'H' });
    const moduleCount = qrData.modules.size;

    // Calculate canvas size from module size (all integers, no rounding issues)
    const canvasSize = moduleSize * (moduleCount + marginModules * 2);

    // Use custom rendering if any rounding is enabled OR if logo is present (to skip modules under logo)
    const useCustomRendering =
      finderRoundingPercent > 0 || moduleRoundingPercent > 0 || iconSrc !== null;

    if (useCustomRendering) {
      const logoArea: LogoAreaConfig = iconSrc
        ? { hasLogo: true, logoSizeRatio, borderSizePercent }
        : { hasLogo: false, logoSizeRatio: 0, borderSizePercent: 0 };

      renderRoundedQR(
        canvas,
        qrData,
        moduleSize,
        marginModules,
        finderRoundingPercent,
        moduleRoundingPercent,
        logoArea,
      );
    } else {
      // Standard rendering with calculated size
      const options: QRCodeOptions = {
        width: canvasSize,
        margin: marginModules,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      };
      await QRCode.toCanvas(canvas, text, options);
    }

    // Add icon if available
    if (iconSrc) {
      await addIconToQRCode(
        canvas,
        iconSrc,
        transparentBg,
        logoSizeRatio,
        borderSizePercent,
        roundedCorners,
        cornerRadiusPercent,
      );

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

    // Show canvas and enable download button
    canvas.classList.remove('hidden');
    const downloadButton = document.getElementById('download-qr') as HTMLButtonElement;
    if (downloadButton) {
      downloadButton.disabled = false;
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
  borderSizePercentage = 5,
  roundedCorners = false,
  cornerRadiusPercent = 15,
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

      // Calculate corner radius for logo (used when roundedCorners is true)
      const logoCornerRadius = roundedCorners ? (iconSize * cornerRadiusPercent) / 100 : 0;

      // Only add background if not using transparent background
      if (!transparentBg && borderSizeInPixels > 0) {
        ctx.save();

        // Use logo corner radius for border if rounded corners enabled, otherwise use dynamic calculation
        const borderRadius = roundedCorners
          ? logoCornerRadius + borderSizeInPixels * 0.5
          : Math.min(borderSizeInPixels * 0.5, iconSize * 0.1, 8);
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

      // Draw icon with optional rounded corners
      if (roundedCorners && logoCornerRadius > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(iconX, iconY, iconSize, iconSize, logoCornerRadius);
        ctx.clip();
        ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
        ctx.restore();
      } else {
        ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
      }

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
