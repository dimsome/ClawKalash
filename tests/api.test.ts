import { describe, it, expect } from 'vitest';
import { buildQuoteParams } from '../scripts/api.js';
import { FEE_TAKER_ADDRESS, FEE_BPS } from '../scripts/types.js';

describe('buildQuoteParams', () => {
  it('builds correct URL params', () => {
    const params = buildQuoteParams({
      userAddress: '0xuser',
      originChainId: 8453,
      destinationChainId: 42161,
      inputToken: '0xinput',
      outputToken: '0xoutput',
      inputAmount: '1000000',
    });

    expect(params.get('userAddress')).toBe('0xuser');
    expect(params.get('receiverAddress')).toBe('0xuser');
    expect(params.get('originChainId')).toBe('8453');
    expect(params.get('destinationChainId')).toBe('42161');
    expect(params.get('inputToken')).toBe('0xinput');
    expect(params.get('outputToken')).toBe('0xoutput');
    expect(params.get('inputAmount')).toBe('1000000');
    expect(params.get('feeTakerAddress')).toBe(FEE_TAKER_ADDRESS);
    expect(params.get('feeBps')).toBe(FEE_BPS);
  });

  it('uses custom receiver when provided', () => {
    const params = buildQuoteParams({
      userAddress: '0xuser',
      receiverAddress: '0xreceiver',
      originChainId: 1,
      destinationChainId: 1,
      inputToken: '0xa',
      outputToken: '0xb',
      inputAmount: '100',
    });

    expect(params.get('receiverAddress')).toBe('0xreceiver');
  });
});
