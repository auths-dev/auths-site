import type { SourceConfig, VerifyFn, Step } from './types';
import { resolveFromRepo, didKeyToPublicKeyHex } from '@/lib/resolver';
import { verifyAttestation } from '@/lib/wasm-bridge';

function clip(hex: string, n = 14): string {
  return hex.length > n * 2 ? `${hex.slice(0, n)}…${hex.slice(-(n / 2))}` : hex;
}

export const githubSource: SourceConfig = {
  id: 'github',
  label: 'GitHub',
  icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',
  placeholder: 'github.com/owner/repo',
  enabled: true,
  commandPrefix: 'auths verify --repo',
};

export const verifyFromGitHub: VerifyFn = async (input, onStep) => {
  const steps: Step[] = [];
  const emit = (step: Step) => { steps.push(step); onStep(step); };

  try {
    // Normalize URL
    let url = input.trim();
    if (!url.startsWith('http')) url = `https://${url}`;

    emit({ type: 'info', text: `Resolving identity from ${url}…` });

    const result = await resolveFromRepo(url);

    if (result.error || !result.bundle) {
      const msg = result.error ?? 'No identity bundle found for this repository.';
      emit({ type: 'err', text: `✗ ${msg}` });
      return { success: false, steps, error: msg };
    }

    const { identity_did, public_key_hex, attestation_chain } = result.bundle;

    emit({ type: 'info', text: `Identity: ${clip(identity_did, 20)}` });
    emit({ type: 'info', text: `Public key: ${clip(public_key_hex)}` });
    emit({ type: 'dim', text: `${attestation_chain.length} attestation(s) in chain` });

    if (attestation_chain.length === 0) {
      emit({ type: 'ok', text: '✓ Identity resolved (no attestations to verify)' });
      return { success: true, steps };
    }

    emit({ type: 'info', text: 'Verifying attestation chain via WASM…' });

    // Determine the issuer public key for verification
    // Use the identity public key from the bundle, converting from DID if needed
    const issuerPkHex = public_key_hex || didKeyToPublicKeyHex(identity_did);

    let allValid = true;
    for (let i = 0; i < attestation_chain.length; i++) {
      const att = attestation_chain[i];
      const attJson = JSON.stringify(att);
      const verification = await verifyAttestation(attJson, issuerPkHex);

      if (verification.valid) {
        emit({ type: 'ok', text: `✓ Attestation ${i + 1}/${attestation_chain.length} verified` });
      } else {
        emit({ type: 'err', text: `✗ Attestation ${i + 1}/${attestation_chain.length}: ${verification.error ?? 'invalid'}` });
        allValid = false;
      }
    }

    if (allValid) {
      emit({ type: 'ok', text: '✓ CHAIN VERIFIED' });
      emit({ type: 'dim', text: 'Cryptographic proof established. No server involved.' });
    } else {
      emit({ type: 'err', text: '✗ CHAIN VERIFICATION FAILED' });
    }

    return { success: allValid, steps };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit({ type: 'err', text: `✗ ${msg}` });
    return { success: false, steps, error: msg };
  }
};
