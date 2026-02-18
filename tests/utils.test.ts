import { describe, it, expect } from 'vitest';
import { parseAmount } from '../scripts/utils.js';

describe('parseAmount', () => {
  // Decimal point → always human-readable
  it('converts 0.1 ETH (18 decimals)', () => {
    expect(parseAmount('0.1', 18)).toBe('100000000000000000');
  });

  it('converts 1.5 ETH (18 decimals)', () => {
    expect(parseAmount('1.5', 18)).toBe('1500000000000000000');
  });

  it('converts 100.0 USDC (6 decimals)', () => {
    expect(parseAmount('100.0', 6)).toBe('100000000');
  });

  it('converts 0.000001 USDC (6 decimals)', () => {
    expect(parseAmount('0.000001', 6)).toBe('1');
  });

  it('converts 0.5 USDC (6 decimals)', () => {
    expect(parseAmount('0.5', 6)).toBe('500000');
  });

  // Small integers → human-readable via heuristic
  it('treats "100" as 100 USDC (6 decimals)', () => {
    // threshold = 10^3 = 1000, 100 < 1000 → human-readable
    expect(parseAmount('100', 6)).toBe('100000000');
  });

  it('treats "1" as 1 ETH (18 decimals)', () => {
    // threshold = 10^9, 1 < 10^9 → human-readable
    expect(parseAmount('1', 18)).toBe('1000000000000000000');
  });

  it('treats "50" as 50 tokens (18 decimals)', () => {
    expect(parseAmount('50', 18)).toBe('50000000000000000000');
  });

  // Large integers → raw (already in wei)
  it('passes through large raw amount for 18 decimals', () => {
    expect(parseAmount('1000000000000000000', 18)).toBe('1000000000000000000');
  });

  it('passes through large raw amount for 6 decimals', () => {
    // threshold = 10^3 = 1000, 100000000 > 1000 → raw
    expect(parseAmount('100000000', 6)).toBe('100000000');
  });

  // Edge cases
  it('converts "0" to "0"', () => {
    expect(parseAmount('0', 18)).toBe('0');
  });

  it('converts "0.0" to "0"', () => {
    expect(parseAmount('0.0', 18)).toBe('0');
  });

  it('throws if too many decimal places', () => {
    expect(() => parseAmount('1.1234567', 6)).toThrow('more decimal places');
  });

  // Backward compatibility: raw wei string without decimal
  it('keeps 1000000000000000 as raw for 18 decimals', () => {
    // 10^15 > 10^9 threshold → raw
    expect(parseAmount('1000000000000000', 18)).toBe('1000000000000000');
  });
});
