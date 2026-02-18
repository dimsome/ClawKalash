import { describe, it, expect } from 'vitest';
import { parseArgs, formatPortfolio, formatQuotePreview, parseChainId } from '../scripts/cli.js';
import type { TokenBalance } from '../scripts/types.js';

describe('parseArgs', () => {
  it('parses command and positional args', () => {
    const result = parseArgs(['swap', '8453', '42161', 'ETH', 'USDC', '1000']);
    expect(result.command).toBe('swap');
    expect(result.args).toEqual(['8453', '42161', 'ETH', 'USDC', '1000']);
    expect(result.flags).toEqual({});
  });

  it('parses --dry-run flag', () => {
    const result = parseArgs(['swap', '8453', '42161', 'ETH', 'USDC', '1000', '--dry-run']);
    expect(result.command).toBe('swap');
    expect(result.flags['dry-run']).toBe(true);
  });

  it('parses --key value flags', () => {
    const result = parseArgs(['portfolio', '--address', '0xabc']);
    expect(result.flags.address).toBe('0xabc');
  });

  it('defaults to help when empty', () => {
    const result = parseArgs([]);
    expect(result.command).toBe('help');
  });
});

describe('formatPortfolio', () => {
  it('returns message for empty portfolio', () => {
    expect(formatPortfolio([])).toBe('No tokens found.');
  });

  it('formats tokens with total', () => {
    const tokens: TokenBalance[] = [
      { chainId: 8453, address: '0x1', name: 'USD Coin', symbol: 'USDC', decimals: 6, balance: '1000000', balanceInUsd: 1.0 },
      { chainId: 1, address: '0x2', name: 'Ether', symbol: 'ETH', decimals: 18, balance: '1000000000000000000', balanceInUsd: 3000.0 },
    ];
    const output = formatPortfolio(tokens);
    expect(output).toContain('Portfolio: $3001.00');
    expect(output).toContain('USDC');
    expect(output).toContain('ETH');
  });
});

describe('formatQuotePreview', () => {
  it('formats dry run output', () => {
    const quote = {
      quoteId: 'q1',
      requestType: 'permit2',
      witness: null,
      signTypedData: null,
      approvalData: null,
      txData: null,
      userOp: null,
      requestHash: null,
      inputAmount: '1000000',
      outputAmount: '999000',
      inputToken: '0xaaa',
      outputToken: '0xbbb',
      originChain: 8453,
      destChain: 42161,
    };
    const output = formatQuotePreview(quote);
    expect(output).toContain('Swap Preview');
    expect(output).toContain('1000000');
    expect(output).toContain('999000');
    expect(output).toContain('ERC20 (permit2)');
  });
});

describe('parseChainId', () => {
  it('parses valid numeric string', () => {
    expect(parseChainId('8453', 'test')).toBe(8453);
  });

  it('throws on non-numeric input', () => {
    expect(() => parseChainId('hello', 'test')).toThrow('not a valid chain ID');
  });
});
