import type { CommitSignatureInfo } from './types';
import { extractSignerKeyFromSsh } from './ssh-signature';

/**
 * Fetch the latest commit's signature info from a GitHub repo.
 * Extracts the signer's Ed25519 public key from the SSH signature.
 * Returns null if the API call fails.
 */
export async function fetchCommitSignature(
  owner: string,
  repo: string,
): Promise<CommitSignatureInfo | null> {
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=1`,
  );

  if (!res.ok) return null;

  const commits = await res.json();
  if (!Array.isArray(commits) || commits.length === 0) return null;

  const commit = commits[0];
  const verification = commit.commit?.verification;

  let signatureType: 'ssh' | 'gpg' | 'none' = 'none';
  let signerKeyHex: string | null = null;

  if (verification?.signature) {
    const sig: string = verification.signature;

    if (sig.includes('SSH SIGNATURE')) {
      signatureType = 'ssh';
      signerKeyHex = extractSignerKeyFromSsh(sig);
    } else if (sig.startsWith('-----BEGIN PGP')) {
      signatureType = 'gpg';
    }
  }

  return {
    sha: commit.sha,
    message: commit.commit?.message ?? '',
    signerKeyHex,
    githubVerified: verification?.verified ?? false,
    signatureType,
  };
}
