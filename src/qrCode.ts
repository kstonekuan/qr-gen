import QRCode from 'qrcode';
import { validateQRCode } from './qrValidator';
import type { IconRender, LogoArea, QRCodeFormConfig, ValidationResult } from './types';

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
  if (row < 7 && col < 7) return true;
  if (row < 7 && col >= moduleCount - 7) return true;
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
  if (logoSizeRatio <= 0) return false;
  // The logo spans canvas.width (which includes the margin), so compute the covered
  // module-range in the same coordinate system and floor/ceil symmetrically to fully
  // clear modules behind the icon.
  const totalSize = moduleCount + marginModules * 2;
  const logoModules = totalSize * logoSizeRatio;
  const borderModules = logoModules * (borderSizePercent / 100);
  const totalLogoModules = logoModules + borderModules * 2;

  const centerModule = moduleCount / 2;
  const halfLogoModules = totalLogoModules / 2;

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

  const outerRadius = (size7 / 2) * (finderRoundingPercent / 50);
  const middleRadius = (size5 / 2) * (finderRoundingPercent / 50);
  const innerRadius = (size3 / 2) * (finderRoundingPercent / 50);

  ctx.fillStyle = '#000000';
  drawRoundedRect(ctx, x, y, size7, size7, outerRadius);

  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, x + moduleSize, y + moduleSize, size5, size5, middleRadius);

  ctx.fillStyle = '#000000';
  drawRoundedRect(ctx, x + moduleSize * 2, y + moduleSize * 2, size3, size3, innerRadius);
}

function renderRoundedQR(
  canvas: HTMLCanvasElement,
  qrData: ReturnType<typeof QRCode.create>,
  moduleSize: number,
  marginModules: number,
  finderRoundingPercent: number,
  moduleRoundingPercent: number,
  logoArea: LogoArea,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const moduleCount = qrData.modules.size;
  const margin = moduleSize * marginModules;
  const canvasSize = moduleSize * (moduleCount + marginModules * 2);
  const moduleRadius = (moduleSize / 2) * (moduleRoundingPercent / 50);

  canvas.width = canvasSize;
  canvas.height = canvasSize;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Finder patterns render as whole rounded shapes rather than per-module.
  drawFinderPattern(ctx, margin, margin, moduleSize, finderRoundingPercent);
  drawFinderPattern(
    ctx,
    margin + (moduleCount - 7) * moduleSize,
    margin,
    moduleSize,
    finderRoundingPercent,
  );
  drawFinderPattern(
    ctx,
    margin,
    margin + (moduleCount - 7) * moduleSize,
    moduleSize,
    finderRoundingPercent,
  );

  ctx.fillStyle = '#000000';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (isInFinderPattern(row, col, moduleCount)) continue;

      if (
        logoArea.kind === 'present' &&
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

function logoAreaFromIcon(icon: IconRender | null): LogoArea {
  if (!icon) return { kind: 'none' };
  return {
    kind: 'present',
    logoSizeRatio: icon.sizeRatio,
    borderSizePercent: icon.border.kind === 'opaque' ? icon.border.sizePercent : 0,
  };
}

// Returns the validation result when an icon was added, otherwise null.
// A bare QR (no icon) is always decodable, so we skip validation.
export async function generateQRCode(
  canvas: HTMLCanvasElement,
  config: QRCodeFormConfig,
): Promise<ValidationResult | null> {
  const marginModules = 2;

  const qrData = QRCode.create(config.text, { errorCorrectionLevel: 'H' });
  const moduleCount = qrData.modules.size;
  const canvasSize = config.moduleSize * (moduleCount + marginModules * 2);

  const needsCustomRender =
    config.finderRoundingPercent > 0 || config.moduleRoundingPercent > 0 || config.icon !== null;

  if (needsCustomRender) {
    renderRoundedQR(
      canvas,
      qrData,
      config.moduleSize,
      marginModules,
      config.finderRoundingPercent,
      config.moduleRoundingPercent,
      logoAreaFromIcon(config.icon),
    );
  } else {
    await QRCode.toCanvas(canvas, config.text, {
      width: canvasSize,
      margin: marginModules,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    });
  }

  if (config.icon) {
    await addIconToQRCode(canvas, config.icon);
    return validateQRCode(canvas);
  }

  return null;
}

function addIconToQRCode(canvas: HTMLCanvasElement, icon: IconRender): Promise<void> {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve();
      return;
    }

    const img = new Image();

    img.onload = () => {
      const iconSize = canvas.width * icon.sizeRatio;
      const iconX = (canvas.width - iconSize) / 2;
      const iconY = (canvas.height - iconSize) / 2;

      const logoCornerRadius =
        icon.corners.kind === 'rounded' ? (iconSize * icon.corners.radiusPercent) / 100 : 0;

      if (icon.border.kind === 'opaque') {
        const borderSizeInPixels = (iconSize * icon.border.sizePercent) / 100;
        if (borderSizeInPixels > 0) {
          const borderRadius =
            icon.corners.kind === 'rounded'
              ? logoCornerRadius + borderSizeInPixels * 0.5
              : Math.min(borderSizeInPixels * 0.5, iconSize * 0.1, 8);

          ctx.save();
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
      }

      if (logoCornerRadius > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(iconX, iconY, iconSize, iconSize, logoCornerRadius);
        ctx.clip();
        ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
        ctx.restore();
      } else {
        ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
      }

      resolve();
    };

    img.onerror = () => {
      resolve();
    };

    img.src = icon.src;
  });
}

export function downloadQRCode(canvas: HTMLCanvasElement): void {
  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = canvas.toDataURL();
  link.click();
}

export { isInFinderPattern, isInLogoArea };
