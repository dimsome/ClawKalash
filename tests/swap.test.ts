import { describe, it, expect } from 'vitest';
import { validateNativeTxData, validatePermit2SignData, getAccount } from '../scripts/swap.js';
import { PERMIT2_ADDRESS } from '../scripts/types.js';

describe('validateNativeTxData', () => {
  const validTx = { value: '1000000', to: '0x1234567890abcdef1234567890abcdef12345678', data: '0x' };

  it('throws when txData.value !== expectedAmount', () => {
    expect(() => validateNativeTxData({ ...validTx, value: '999' }, '1000000', 8453)).toThrow('does not match');
  });

  it('throws when txData.to === zero address', () => {
    expect(() => validateNativeTxData(
      { ...validTx, to: '0x0000000000000000000000000000000000000000' },
      '1000000', 8453
    )).toThrow('zero address');
  });

  it('throws when txData.chainId !== expectedChainId', () => {
    expect(() => validateNativeTxData({ ...validTx, chainId: 1 }, '1000000', 8453)).toThrow('does not match origin chain');
  });

  it('passes when txData.chainId is absent', () => {
    expect(() => validateNativeTxData(validTx, '1000000', 8453)).not.toThrow();
  });

  it('passes when all fields are valid', () => {
    expect(() => validateNativeTxData({ ...validTx, chainId: 8453 }, '1000000', 8453)).not.toThrow();
  });
});

describe('validatePermit2SignData', () => {
  const validSignData = {
    domain: { verifyingContract: PERMIT2_ADDRESS },
    values: { permitted: { token: '0xAbC123', amount: '5000000' } },
  };

  it('throws when domain.verifyingContract !== PERMIT2_ADDRESS', () => {
    const bad = { ...validSignData, domain: { verifyingContract: '0xDEAD' } };
    expect(() => validatePermit2SignData(bad, '0xAbC123', '5000000')).toThrow('verifyingContract mismatch');
  });

  it('throws when permitted.amount !== expectedAmount', () => {
    const bad = { domain: validSignData.domain, values: { permitted: { token: '0xAbC123', amount: '999' } } };
    expect(() => validatePermit2SignData(bad, '0xAbC123', '5000000')).toThrow('amount mismatch');
  });

  it('throws when permitted.token !== expectedToken (case-insensitive)', () => {
    const bad = { domain: validSignData.domain, values: { permitted: { token: '0xWRONG', amount: '5000000' } } };
    expect(() => validatePermit2SignData(bad, '0xAbC123', '5000000')).toThrow('token mismatch');
  });

  it('passes when all fields are valid', () => {
    expect(() => validatePermit2SignData(validSignData, '0xabc123', '5000000')).not.toThrow();
  });
});

describe('getAccount', () => {
  const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const TEST_PRIVKEY = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  it('returns valid account from mnemonic', () => {
    const account = getAccount(TEST_MNEMONIC);
    expect(account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it('returns valid account from private key with 0x prefix', () => {
    const account = getAccount(`0x${TEST_PRIVKEY}`);
    expect(account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it('returns valid account from private key without 0x prefix', () => {
    const account = getAccount(TEST_PRIVKEY);
    expect(account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
