import { describe, it, expect } from 'vitest';
import { didKeyToPublicKeyHex, sanitizeDidForRef } from '../../src/resolvers/did-utils';

describe('didKeyToPublicKeyHex', () => {
  it('should extract Ed25519 public key from did:key:z...', () => {
    // Known test vector:
    // Ed25519 public key (32 bytes hex): d75a980182b10ab7d54bfed3c964073a0ee172f3daa3f4a18446b7e8c7f8e2db
    // Multicodec prefix: ed01
    // Base58btc of ed01 + key: z6MkiTBz1ymuepAQ4HEHYSF1H8quG5GLVVQR3djdX3mDooWp
    const didKey = 'did:key:z6MkiTBz1ymuepAQ4HEHYSF1H8quG5GLVVQR3djdX3mDooWp';
    const hex = didKeyToPublicKeyHex(didKey);
    // Should be 64 hex chars (32 bytes)
    expect(hex).toHaveLength(64);
    // Verify it's valid hex
    expect(hex).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should reject non did:key:z... format', () => {
    expect(() => didKeyToPublicKeyHex('did:keri:EOrg123')).toThrow('Expected did:key:z');
    expect(() => didKeyToPublicKeyHex('not-a-did')).toThrow('Expected did:key:z');
  });

  it('should produce consistent results for same input', () => {
    const did = 'did:key:z6MkiTBz1ymuepAQ4HEHYSF1H8quG5GLVVQR3djdX3mDooWp';
    const hex1 = didKeyToPublicKeyHex(did);
    const hex2 = didKeyToPublicKeyHex(did);
    expect(hex1).toBe(hex2);
  });
});

describe('sanitizeDidForRef', () => {
  it('should replace colons with underscores', () => {
    expect(sanitizeDidForRef('did:keri:EOrg123')).toBe('did_keri_EOrg123');
  });

  it('should replace all non-alphanumeric characters', () => {
    expect(sanitizeDidForRef('did:key:z6Mk...')).toBe('did_key_z6Mk___');
  });

  it('should keep alphanumeric characters unchanged', () => {
    expect(sanitizeDidForRef('abc123')).toBe('abc123');
  });

  it('should handle empty string', () => {
    expect(sanitizeDidForRef('')).toBe('');
  });
});
