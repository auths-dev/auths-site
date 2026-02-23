import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the verifier-bridge before importing the component
vi.mock('../src/verifier-bridge', () => ({
  ensureInit: vi.fn().mockResolvedValue(undefined),
  verifyAttestation: vi.fn(),
  verifyChain: vi.fn(),
}));

import { ensureInit, verifyAttestation, verifyChain } from '../src/verifier-bridge';
import type { VerificationReport } from '../src/types';

// Import component to register it
import '../src/auths-verify';

const VALID_REPORT: VerificationReport = {
  status: { type: 'Valid' },
  chain: [
    { issuer: 'did:keri:abc123', subject: 'did:key:z456def', valid: true },
  ],
  warnings: [],
};

const INVALID_REPORT: VerificationReport = {
  status: { type: 'InvalidSignature', step: 0 },
  chain: [
    { issuer: 'did:keri:abc123', subject: 'did:key:z456def', valid: false, error: 'Bad signature' },
  ],
  warnings: [],
};

const EXPIRED_REPORT: VerificationReport = {
  status: { type: 'Expired', at: '2024-01-01T00:00:00Z' },
  chain: [],
  warnings: ['Attestation expired on Jan 1, 2024'],
};

function createElement(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement('auths-verify');
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function flush(): Promise<void> {
  return new Promise((r) => setTimeout(r, 60)); // > debounce (50ms)
}

describe('auths-verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  // --- Registration ---

  it('should be registered as a custom element', () => {
    expect(customElements.get('auths-verify')).toBeDefined();
  });

  it('should create an instance with shadow DOM', () => {
    const el = createElement();
    document.body.appendChild(el);
    expect(el.shadowRoot).not.toBeNull();
  });

  // --- Attribute reflection ---

  it('should reflect attestation property to attribute', () => {
    const el = createElement() as any;
    document.body.appendChild(el);
    el.attestation = '{"test":true}';
    expect(el.getAttribute('attestation')).toBe('{"test":true}');
  });

  it('should reflect publicKey property to public-key attribute', () => {
    const el = createElement() as any;
    document.body.appendChild(el);
    el.publicKey = 'aabbccdd';
    expect(el.getAttribute('public-key')).toBe('aabbccdd');
  });

  it('should reflect mode property to attribute', () => {
    const el = createElement() as any;
    document.body.appendChild(el);
    el.mode = 'detail';
    expect(el.getAttribute('mode')).toBe('detail');
  });

  // --- State rendering ---

  it('should render idle state initially', () => {
    const el = createElement();
    document.body.appendChild(el);
    const label = el.shadowRoot!.querySelector('.label');
    expect(label?.textContent).toBe('Not verified');
  });

  it('should render verified state after successful verification', async () => {
    vi.mocked(verifyAttestation).mockResolvedValue({ valid: true });

    const el = createElement({
      attestation: '{"test":true}',
      'public-key': 'aabb',
      'auto-verify': 'false',
    }) as any;
    document.body.appendChild(el);

    await el.verify();
    const label = el.shadowRoot!.querySelector('.label');
    expect(label?.textContent).toBe('Verified');
    expect(el.getAttribute('data-state')).toBe('verified');
  });

  it('should render invalid state for bad signature', async () => {
    vi.mocked(verifyChain).mockResolvedValue(INVALID_REPORT);

    const el = createElement({
      attestations: '[{"test":true}]',
      'public-key': 'aabb',
      'auto-verify': 'false',
    }) as any;
    document.body.appendChild(el);

    await el.verify();
    expect(el.getAttribute('data-state')).toBe('invalid');
  });

  it('should render expired state', async () => {
    vi.mocked(verifyChain).mockResolvedValue(EXPIRED_REPORT);

    const el = createElement({
      attestations: '[{"test":true}]',
      'public-key': 'aabb',
      'auto-verify': 'false',
    }) as any;
    document.body.appendChild(el);

    await el.verify();
    expect(el.getAttribute('data-state')).toBe('expired');
  });

  it('should render error state when verification throws', async () => {
    vi.mocked(verifyAttestation).mockRejectedValue(new Error('WASM crash'));

    const el = createElement({
      attestation: '{"test":true}',
      'public-key': 'aabb',
      'auto-verify': 'false',
    }) as any;
    document.body.appendChild(el);

    await el.verify();
    expect(el.getAttribute('data-state')).toBe('error');
  });

  // --- Mode rendering ---

  it('should render detail panel when mode=detail', async () => {
    vi.mocked(verifyChain).mockResolvedValue(VALID_REPORT);

    const el = createElement({
      attestations: '[{"test":true}]',
      'public-key': 'aabb',
      mode: 'detail',
      'auto-verify': 'false',
    }) as any;
    document.body.appendChild(el);

    await el.verify();
    const panel = el.shadowRoot!.querySelector('.detail-panel');
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render tooltip wrapper when mode=tooltip', () => {
    const el = createElement({ mode: 'tooltip' });
    document.body.appendChild(el);
    const wrapper = el.shadowRoot!.querySelector('.tooltip-wrapper');
    expect(wrapper).not.toBeNull();
  });

  // --- verify() and getReport() ---

  it('should return report from getReport()', async () => {
    vi.mocked(verifyAttestation).mockResolvedValue({ valid: true });

    const el = createElement({
      attestation: '{"test":true}',
      'public-key': 'aabb',
      'auto-verify': 'false',
    }) as any;
    document.body.appendChild(el);

    expect(el.getReport()).toBeNull();
    await el.verify();
    const report = el.getReport();
    expect(report).not.toBeNull();
    expect(report.status.type).toBe('Valid');
  });

  // --- Events ---

  it('should dispatch auths-verified event on success', async () => {
    vi.mocked(verifyAttestation).mockResolvedValue({ valid: true });

    const el = createElement({
      attestation: '{"test":true}',
      'public-key': 'aabb',
      'auto-verify': 'false',
    }) as any;
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener('auths-verified', handler);
    await el.verify();
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].detail.status.type).toBe('Valid');
  });

  it('should dispatch auths-error event on failure', async () => {
    vi.mocked(verifyAttestation).mockRejectedValue(new Error('fail'));

    const el = createElement({
      attestation: '{"test":true}',
      'public-key': 'aabb',
      'auto-verify': 'false',
    }) as any;
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener('auths-error', handler);
    await el.verify();
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].detail.error).toBe('fail');
  });

  // --- Auto-verify ---

  it('should auto-verify when connected with input', async () => {
    vi.mocked(verifyAttestation).mockResolvedValue({ valid: true });

    const el = createElement({
      attestation: '{"test":true}',
      'public-key': 'aabb',
    });
    document.body.appendChild(el);

    await flush();
    expect(verifyAttestation).toHaveBeenCalled();
  });

  it('should not auto-verify when auto-verify=false', async () => {
    const el = createElement({
      attestation: '{"test":true}',
      'public-key': 'aabb',
      'auto-verify': 'false',
    });
    document.body.appendChild(el);

    await flush();
    expect(verifyAttestation).not.toHaveBeenCalled();
  });

  // --- Accessibility ---

  it('should have role=status on badge', () => {
    const el = createElement();
    document.body.appendChild(el);
    const badge = el.shadowRoot!.querySelector('.badge');
    expect(badge?.getAttribute('role')).toBe('status');
  });

  it('should have aria-live=polite on badge', () => {
    const el = createElement();
    document.body.appendChild(el);
    const badge = el.shadowRoot!.querySelector('.badge');
    expect(badge?.getAttribute('aria-live')).toBe('polite');
  });

  it('should have aria-expanded on badge in detail mode', () => {
    const el = createElement({ mode: 'detail' });
    document.body.appendChild(el);
    const badge = el.shadowRoot!.querySelector('.badge');
    expect(badge?.getAttribute('aria-expanded')).toBe('false');
  });
});
