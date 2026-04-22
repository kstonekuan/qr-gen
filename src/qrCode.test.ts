import { describe, expect, it } from 'vitest';
import { isInFinderPattern, isInLogoArea } from './qrCode';

describe('isInFinderPattern', () => {
  // Version-1 QR codes are 21x21 modules; finder patterns are the three 7x7 corners.
  const moduleCount = 21;

  it('returns true for the top-left corner block', () => {
    expect(isInFinderPattern(0, 0, moduleCount)).toBe(true);
    expect(isInFinderPattern(6, 6, moduleCount)).toBe(true);
  });

  it('returns true for the top-right corner block', () => {
    expect(isInFinderPattern(0, moduleCount - 1, moduleCount)).toBe(true);
    expect(isInFinderPattern(6, moduleCount - 7, moduleCount)).toBe(true);
  });

  it('returns true for the bottom-left corner block', () => {
    expect(isInFinderPattern(moduleCount - 1, 0, moduleCount)).toBe(true);
    expect(isInFinderPattern(moduleCount - 7, 6, moduleCount)).toBe(true);
  });

  it('returns false for the bottom-right corner (no finder pattern there)', () => {
    expect(isInFinderPattern(moduleCount - 1, moduleCount - 1, moduleCount)).toBe(false);
  });

  it('returns false for the data area just past the finders', () => {
    expect(isInFinderPattern(7, 7, moduleCount)).toBe(false);
    expect(isInFinderPattern(10, 10, moduleCount)).toBe(false);
  });
});

describe('isInLogoArea', () => {
  // Mirrors the call in renderRoundedQR: marginModules is fixed at 2.
  const moduleCount = 21;
  const marginModules = 2;

  it('returns true for the centre module when a logo covers 20%', () => {
    const center = Math.floor(moduleCount / 2);
    expect(isInLogoArea(center, center, moduleCount, marginModules, 0.2, 0)).toBe(true);
  });

  it('returns false for corners regardless of logo size', () => {
    expect(isInLogoArea(0, 0, moduleCount, marginModules, 0.3, 0)).toBe(false);
    expect(isInLogoArea(moduleCount - 1, moduleCount - 1, moduleCount, marginModules, 0.3, 0)).toBe(
      false,
    );
  });

  it('expands the covered area when the border grows', () => {
    // With 10% logo and no border, a module 2 steps off-centre is outside;
    // the same module should fall inside once a large border is added.
    const offset = 2;
    const center = Math.floor(moduleCount / 2);
    expect(isInLogoArea(center + offset, center, moduleCount, marginModules, 0.1, 0)).toBe(false);
    expect(isInLogoArea(center + offset, center, moduleCount, marginModules, 0.1, 200)).toBe(true);
  });
});
