import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, createWallet, importWallet, loadWallet } from '../scripts/wallet.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('wallet encryption', () => {
  it('round-trips a private key', () => {
    const key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const password = 'test-password-123';
    const { encrypted, iv, salt } = encrypt(key, password);
    const decrypted = decrypt(encrypted, iv, salt, password);
    expect(decrypted).toBe(key);
  });

  it('round-trips a mnemonic', () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const password = 'another-pass';
    const { encrypted, iv, salt } = encrypt(mnemonic, password);
    const decrypted = decrypt(encrypted, iv, salt, password);
    expect(decrypted).toBe(mnemonic);
  });

  it('fails with wrong password', () => {
    const key = '0xdeadbeef';
    const { encrypted, iv, salt } = encrypt(key, 'correct');
    expect(() => decrypt(encrypted, iv, salt, 'wrong')).toThrow();
  });

  it('generates unique salts per encryption', () => {
    const { salt: salt1 } = encrypt('test', 'pass');
    const { salt: salt2 } = encrypt('test', 'pass');
    expect(salt1).not.toBe(salt2);
  });
});

describe('wallet round-trip', () => {
  let tmpDir: string;
  const origWalletPath = process.env.WALLET_PATH;
  const origWalletKey = process.env.WALLET_KEY;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawkalash-test-'));
    process.env.WALLET_PATH = path.join(tmpDir, '.wallet.enc');
    process.env.WALLET_KEY = 'test-encryption-key-42';
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (origWalletPath) process.env.WALLET_PATH = origWalletPath; else delete process.env.WALLET_PATH;
    if (origWalletKey) process.env.WALLET_KEY = origWalletKey; else delete process.env.WALLET_KEY;
  });

  it('createWallet → loadWallet returns valid address and decryptable key', () => {
    const { address } = createWallet();
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    const loaded = loadWallet();
    expect(loaded).not.toBeNull();
    expect(loaded!.address).toBe(address);
    expect(loaded!.privateKey).toBeTruthy();
  });

  it('importWallet with private key including 0x prefix', () => {
    const pk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const address = importWallet(pk);
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    const loaded = loadWallet();
    expect(loaded!.privateKey).toBe(pk);
  });

  it('importWallet with private key without 0x prefix', () => {
    const pk = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const address = importWallet(pk);
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    const loaded = loadWallet();
    expect(loaded!.privateKey).toBe(`0x${pk}`);
  });

  it('importWallet with mnemonic phrase', () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const address = importWallet(mnemonic);
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    const loaded = loadWallet();
    expect(loaded!.privateKey).toBe(mnemonic);
  });

  it('loadWallet returns null when no file exists', () => {
    const loaded = loadWallet();
    expect(loaded).toBeNull();
  });
});
