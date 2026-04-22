import { describe, expect, it } from 'vitest';
import { parseTabType } from './types';

describe('parseTabType', () => {
  it('returns the TabType when raw matches a known tab', () => {
    expect(parseTabType('upload')).toBe('upload');
    expect(parseTabType('generate')).toBe('generate');
  });

  it('returns null for unknown strings', () => {
    expect(parseTabType('settings')).toBeNull();
    expect(parseTabType('Generate')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(parseTabType(undefined)).toBeNull();
  });
});
