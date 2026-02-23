import type { SourceConfig, VerifyFn, Step } from './types';
import { verifyAttestation } from '@/lib/wasm-bridge';

interface ArtifactAttestation {
  subject?: string;
  device_public_key?: string;
  payload?: {
    digest?: { hex?: string };
    name?: string;
  };
}

function clip(hex: string, n = 14): string {
  return hex.length > n * 2 ? `${hex.slice(0, n)}…${hex.slice(-(n / 2))}` : hex;
}

export const manualSource: SourceConfig = {
  id: 'manual',
  label: 'Local',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  placeholder: 'Drop artifact + .auths.json',
  enabled: true,
  commandPrefix: 'auths verify',
};

export const verifyManual: VerifyFn = async (input, onStep, extra) => {
  const steps: Step[] = [];
  const emit = (step: Step) => { steps.push(step); onStep(step); };

  try {
    let att: ArtifactAttestation;
    try {
      att = JSON.parse(input);
    } catch {
      throw new Error('Invalid .auths.json — could not parse JSON.');
    }

    const attDigest = att.payload?.digest?.hex;
    if (extra?.fileHash && attDigest) {
      if (attDigest !== extra.fileHash) {
        throw new Error(
          `File hash mismatch.\n  Attestation covers: ${clip(attDigest)}\n  Dropped file hash:  ${clip(extra.fileHash)}`,
        );
      }
      emit({ type: 'ok', text: '✓ artifact hash matches attestation digest' });
    }

    emit({ type: 'info', text: `att: ${clip(input, 8)}` });

    const pkHex = att.device_public_key;
    if (!pkHex) {
      throw new Error('Attestation is missing device_public_key field.');
    }

    if (att.subject) emit({ type: 'info', text: `device: ${clip(att.subject, 12)}` });
    emit({ type: 'info', text: 'Calling WASM attestation verifier…' });

    const verification = await verifyAttestation(input, pkHex);

    if (verification.valid) {
      emit({ type: 'ok', text: '✓ SIGNATURE VERIFIED' });
      emit({ type: 'dim', text: 'Cryptographic proof established. No server involved.' });
      return { success: true, steps };
    } else {
      throw new Error(verification.error ?? 'Attestation signature is invalid.');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit({ type: 'err', text: '✗ VERIFICATION FAILED' });
    emit({ type: 'err', text: msg });
    return { success: false, steps, error: msg };
  }
};
