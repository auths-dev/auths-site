import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for GitHub release asset downloads.
 *
 * GitHub's browser_download_url redirects through domains without CORS headers,
 * so browser fetch() fails silently. This route fetches server-side and returns
 * the content with proper CORS.
 *
 * GET /api/github/release-assets?owner=X&repo=Y
 */
export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get('owner');
  const repo = req.nextUrl.searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
  }

  // Only allow alphanumeric, hyphens, underscores, dots in owner/repo
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
    return NextResponse.json({ error: 'invalid owner or repo' }, { status: 400 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
    { headers: { Accept: 'application/vnd.github+json' } },
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'no releases found' }, { status: 404 });
  }

  const release = await res.json();
  const tag: string = release.tag_name;
  const assets: { name: string; url: string }[] = release.assets ?? [];
  const authsAssets = assets.filter((a) => a.name.endsWith('.auths.json'));

  if (authsAssets.length === 0) {
    return NextResponse.json({ error: 'no .auths.json assets' }, { status: 404 });
  }

  const attestations = [];
  for (const asset of authsAssets) {
    const dlRes = await fetch(asset.url, {
      headers: { Accept: 'application/octet-stream' },
      redirect: 'follow',
    });
    if (!dlRes.ok) continue;
    const raw = await dlRes.text();
    try {
      const attestation = JSON.parse(raw);
      attestations.push({
        tag,
        name: asset.name,
        artifactName: asset.name.replace(/\.auths\.json$/, ''),
        attestation,
        raw,
      });
    } catch {
      // skip malformed
    }
  }

  if (attestations.length === 0) {
    return NextResponse.json({ error: 'failed to download attestations' }, { status: 502 });
  }

  return NextResponse.json({ tag, attestations });
}
