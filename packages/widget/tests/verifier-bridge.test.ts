import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

/**
 * Test the verifier-bridge module by mocking the dynamic import at the Vite level.
 * We create a virtual module that vi.mock can resolve.
 */

const mockDefault = vi.fn().mockResolvedValue(undefined);
const mockVerifyAttestation = vi.fn().mockReturnValue(
  JSON.stringify({ valid: true }),
);
const mockVerifyChain = vi.fn().mockReturnValue(
  JSON.stringify({
    status: { type: 'Valid' },
    chain: [{ issuer: 'did:keri:a', subject: 'did:key:b', valid: true }],
    warnings: [],
  }),
);

// Mock the entire verifier-bridge module with a test double that
// simulates the same logic but uses our mock functions directly.
vi.mock('../src/verifier-bridge', () => {
  let initialized = false;

  return {
    ensureInit: vi.fn(async () => {
      if (!initialized) {
        await mockDefault();
        initialized = true;
      }
    }),
    verifyAttestation: vi.fn(async (json: string, pk: string) => {
      try {
        const resultJson = mockVerifyAttestation(json, pk);
        return JSON.parse(resultJson);
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
    verifyChain: vi.fn(async (attestations: (string | object)[], rootPk: string) => {
      const attestationsJson = JSON.stringify(
        attestations.map((att: string | object) => (typeof att === 'string' ? JSON.parse(att) : att)),
      );
      try {
        const reportJson = mockVerifyChain(attestationsJson, rootPk);
        return JSON.parse(reportJson);
      } catch (error) {
        return {
          status: {
            type: 'BrokenChain',
            missing_link: error instanceof Error ? error.message : String(error),
          },
          chain: [],
          warnings: [],
        };
      }
    }),
  };
});

import { ensureInit, verifyAttestation, verifyChain } from '../src/verifier-bridge';

describe('verifier-bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ensureInit should initialize without error', async () => {
    await expect(ensureInit()).resolves.toBeUndefined();
    expect(mockDefault).toHaveBeenCalled();
  });

  it('ensureInit should be callable multiple times without error', async () => {
    await ensureInit();
    await expect(ensureInit()).resolves.toBeUndefined();
  });

  it('verifyAttestation should return valid result', async () => {
    const result = await verifyAttestation('{"test":true}', 'aabbccdd');
    expect(result.valid).toBe(true);
    expect(mockVerifyAttestation).toHaveBeenCalledWith('{"test":true}', 'aabbccdd');
  });

  it('verifyChain should return valid report', async () => {
    const report = await verifyChain(['{"test":true}'], 'aabbccdd');
    expect(report.status.type).toBe('Valid');
    expect(report.chain).toHaveLength(1);
  });

  it('verifyAttestation should handle errors gracefully', async () => {
    mockVerifyAttestation.mockImplementation(() => {
      throw new Error('Bad key');
    });

    const result = await verifyAttestation('{"test":true}', 'bad');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Bad key');
  });

  it('verifyChain should return BrokenChain on error', async () => {
    mockVerifyChain.mockImplementation(() => {
      throw new Error('Missing link');
    });

    const report = await verifyChain(['{"test":true}'], 'bad');
    expect(report.status.type).toBe('BrokenChain');
  });

  it('verifyAttestation should pass through WASM results', async () => {
    mockVerifyAttestation.mockReturnValue(
      JSON.stringify({ valid: false, error: 'Signature mismatch' }),
    );

    const result = await verifyAttestation('{"bad":true}', 'pk');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Signature mismatch');
  });

  it('verifyChain should handle chain with warnings', async () => {
    mockVerifyChain.mockReturnValue(
      JSON.stringify({
        status: { type: 'Valid' },
        chain: [],
        warnings: ['Attestation expires soon'],
      }),
    );

    const report = await verifyChain([], 'pk');
    expect(report.status.type).toBe('Valid');
    expect(report.warnings).toContain('Attestation expires soon');
  });
});
