/**
 * Utility functions for ClawKalash
 */

/**
 * Parse a human-readable or raw amount string into raw token units (wei).
 * 
 * Rules:
 * - If the string contains a `.`, it's human-readable (e.g. "0.1" ETH)
 * - If it's a pure integer, use a heuristic: if the value < 10^(decimals/2),
 *   treat it as human-readable (e.g. "100" for an 18-decimal token = 100 tokens)
 * - Otherwise pass through as raw (e.g. "1000000000000000000" = 1 ETH in wei)
 */
export function parseAmount(amount: string, decimals: number): string {
  // Contains decimal point → human-readable
  if (amount.includes('.')) {
    return humanToRaw(amount, decimals);
  }

  // Pure integer — heuristic check
  const threshold = BigInt(10) ** BigInt(Math.floor(decimals / 2));
  try {
    const val = BigInt(amount);
    if (val < threshold) {
      // Small number for this token's decimals → human-readable
      return humanToRaw(amount, decimals);
    }
    // Large number → already raw
    return amount;
  } catch {
    // Not a valid bigint, try as human-readable
    return humanToRaw(amount, decimals);
  }
}

/**
 * Convert a human-readable amount (possibly with decimals) to raw units.
 * Handles arbitrary precision without floating point errors.
 */
function humanToRaw(amount: string, decimals: number): string {
  const [intPart, fracPart = ''] = amount.split('.');
  
  if (fracPart.length > decimals) {
    throw new Error(`Amount "${amount}" has more decimal places (${fracPart.length}) than token supports (${decimals})`);
  }

  // Pad fractional part to `decimals` length
  const padded = fracPart.padEnd(decimals, '0');
  const raw = intPart + padded;
  
  // Remove leading zeros but keep at least "0"
  return raw.replace(/^0+/, '') || '0';
}
