import type { ForgeConfig, ForgeType } from './types';

/**
 * Parse a repository URL and detect the forge type.
 *
 * - github.com → github
 * - gitlab.com → gitlab
 * - Unknown host → defaults to gitea (self-hosted)
 * - forgeHint overrides auto-detection
 */
export function detectForge(repoUrl: string, forgeHint?: string): ForgeConfig | null {
  let url: URL;
  try {
    url = new URL(repoUrl);
  } catch {
    return null;
  }

  // Strip .git suffix and trailing slash from pathname
  const path = url.pathname.replace(/\.git$/, '').replace(/\/$/, '');
  const segments = path.split('/').filter(Boolean);

  if (segments.length < 2) return null;

  const owner = segments[0];
  const repo = segments[1];

  let type: ForgeType;
  let baseUrl: string;

  if (forgeHint) {
    type = forgeHint as ForgeType;
  } else {
    const host = url.hostname.toLowerCase();
    if (host === 'github.com') {
      type = 'github';
    } else if (host === 'gitlab.com') {
      type = 'gitlab';
    } else {
      type = 'gitea';
    }
  }

  switch (type) {
    case 'github':
      baseUrl = 'https://api.github.com';
      break;
    case 'gitlab':
      baseUrl = `${url.protocol}//${url.host}`;
      break;
    case 'gitea':
      baseUrl = `${url.protocol}//${url.host}`;
      break;
    default:
      return null;
  }

  return { type, baseUrl, owner, repo };
}
