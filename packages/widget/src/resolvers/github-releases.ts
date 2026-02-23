import type { ReleaseAttestation } from './types';

/**
 * Fetch .auths.json attestation files from a GitHub repo's latest release.
 * Returns null if no releases or no .auths.json assets found.
 */
export async function fetchReleaseAttestations(
  owner: string,
  repo: string,
): Promise<{ tag: string; attestations: ReleaseAttestation[] } | null> {
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`,
  );

  if (!res.ok) return null;

  const release = await res.json();
  const tag: string = release.tag_name;

  const assets: { name: string; browser_download_url: string }[] =
    release.assets ?? [];

  const authsAssets = assets.filter((a) => a.name.endsWith('.auths.json'));
  if (authsAssets.length === 0) return null;

  const attestations: ReleaseAttestation[] = [];

  for (const asset of authsAssets) {
    try {
      const dlRes = await fetch(asset.browser_download_url);
      if (!dlRes.ok) continue;

      const raw = await dlRes.text();
      const attestation = JSON.parse(raw);

      attestations.push({
        tag,
        name: asset.name,
        artifactName: asset.name.replace(/\.auths\.json$/, ''),
        attestation,
        raw,
      });
    } catch {
      // Skip malformed assets
    }
  }

  if (attestations.length === 0) return null;

  return { tag, attestations };
}
