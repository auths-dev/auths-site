import type { SourceConfig, VerifyFn, Step } from './types';
import type { ReleaseAttestation } from '@/lib/resolver';
import { detectForge, fetchCommitSignature } from '@/lib/resolver';
import { verifyAttestation } from '@/lib/wasm-bridge';

function clip(hex: string, n = 14): string {
  return hex.length > n * 2 ? `${hex.slice(0, n)}…${hex.slice(-(n / 2))}` : hex;
}

/**
 * Fetch release attestations via the server-side API proxy.
 * GitHub release asset downloads redirect through domains without CORS headers,
 * so browser fetch() fails. The proxy fetches server-side.
 */
async function fetchReleasesViaProxy(
  owner: string,
  repo: string,
): Promise<{ tag: string; attestations: ReleaseAttestation[] } | null> {
  try {
    const res = await fetch(
      `/api/github/release-assets?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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

    const config = detectForge(url);
    if (!config) {
      emit({ type: 'err', text: '✗ Could not parse repository URL' });
      return { success: false, steps, error: 'Invalid repository URL' };
    }

    emit({ type: 'info', text: `Checking ${config.owner}/${config.repo}…` });

    // Phase 1: Release attestations (via server proxy to avoid CORS)
    emit({ type: 'dim', text: 'Looking for release attestations…' });
    const releases = await fetchReleasesViaProxy(config.owner, config.repo);

    if (releases) {
      emit({ type: 'info', text: `Source: Release ${releases.tag}` });
      emit({ type: 'dim', text: `${releases.attestations.length} attestation(s) found` });

      let allValid = true;
      for (const att of releases.attestations) {
        const devicePk = (att.attestation as { device_public_key?: string }).device_public_key;
        if (!devicePk) {
          emit({ type: 'err', text: `✗ ${att.artifactName}: missing device_public_key` });
          allValid = false;
          continue;
        }

        const result = await verifyAttestation(att.raw, devicePk);
        if (result.valid) {
          emit({ type: 'ok', text: `✓ ${att.artifactName} verified` });
        } else {
          emit({ type: 'err', text: `✗ ${att.artifactName}: ${result.error ?? 'invalid'}` });
          allValid = false;
        }
      }

      if (allValid) {
        emit({ type: 'ok', text: '✓ ALL RELEASE ATTESTATIONS VERIFIED' });
        emit({ type: 'dim', text: 'Cryptographic proof established. No server involved.' });
      } else {
        emit({ type: 'err', text: '✗ SOME ATTESTATIONS FAILED' });
      }

      return { success: allValid, steps };
    }

    // Phase 2: Commit signature fallback
    emit({ type: 'dim', text: 'No release attestations. Checking commit signatures…' });
    const commit = await fetchCommitSignature(config.owner, config.repo);

    if (commit?.signerKeyHex) {
      emit({ type: 'info', text: `Source: Commit ${commit.sha.slice(0, 8)}` });
      emit({ type: 'info', text: `Signer key: ${clip(commit.signerKeyHex)}` });
      emit({ type: 'dim', text: `Signature type: ${commit.signatureType}` });

      if (commit.githubVerified) {
        emit({ type: 'ok', text: '✓ Signature verified by GitHub' });
      } else {
        emit({ type: 'dim', text: 'Signature not verified by GitHub' });
      }

      emit({ type: 'ok', text: '✓ Ed25519 signer key extracted from commit' });
      emit({ type: 'dim', text: 'Compare this key with your known device keys.' });

      return { success: true, steps };
    }

    if (commit && commit.signatureType !== 'none') {
      emit({ type: 'info', text: `Source: Commit ${commit.sha.slice(0, 8)}` });
      emit({ type: 'dim', text: `Signature type: ${commit.signatureType} (non-Ed25519, cannot extract key)` });

      if (commit.githubVerified) {
        emit({ type: 'ok', text: '✓ Signature verified by GitHub' });
      }

      return { success: commit.githubVerified, steps };
    }

    // Phase 3: Nothing found
    emit({ type: 'err', text: '✗ No auths attestations or signed commits found' });
    return { success: false, steps, error: 'No attestations or signed commits found' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit({ type: 'err', text: `✗ ${msg}` });
    return { success: false, steps, error: msg };
  }
};
