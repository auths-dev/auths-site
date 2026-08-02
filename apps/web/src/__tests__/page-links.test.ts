import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(SRC, '../../..');
const read = (rel: string): string => readFileSync(join(SRC, rel), 'utf8');
const readRepo = (rel: string): string => readFileSync(join(REPO, rel), 'utf8');

const landing = read('components/landing-ledger.tsx');
const verify = read('app/verify/page.tsx');
const network = read('app/network/page.tsx');

describe('home conversion CTAs point at the docs, not the bare repo', () => {
  it('routes "Read the quickstart" to the quickstart', () => {
    expect(landing).toContain('href="https://docs.auths.dev/mcp/quickstart">Read the quickstart');
  });

  it('routes "How the audit works" to the receipts walkthrough', () => {
    expect(landing).toContain(
      'href="https://docs.auths.dev/mcp/concepts/receipts">How the audit works',
    );
  });
});

describe('the value-prop hero headline is locked', () => {
  it('renders the exact headline', () => {
    expect(landing).toContain('Your agent can&rsquo;t exceed its budget. And you can prove it.');
  });
});

describe('the /verify page offers a forward action', () => {
  it('closes with a quickstart CTA after the terminals', () => {
    expect(verify).toContain('href="https://docs.auths.dev/mcp/quickstart"');
    expect(verify).toContain('Wrap your first agent');
  });
});

describe('the /network cloud tiers have a conversion path', () => {
  it('offers a launch-notification mailto', () => {
    expect(network).toContain('mailto:network@auths.dev');
    expect(network).toContain('Notify me at launch');
  });
});

describe('current Auths adoption links use the supported implementation', () => {
  const currentSurfaces = [
    'README.md',
    'apps/web/next.config.ts',
    'apps/web/src/components/site-nav.tsx',
    'apps/web/src/components/landing-ledger.tsx',
    'apps/web/src/app/iam/page.tsx',
    'apps/web/src/app/supply-chain/page.tsx',
    'apps/web/src/app/trust/page.tsx',
    'apps/explorer/src/components/explorer-nav.tsx',
    'apps/explorer/src/app/page.tsx',
    'apps/explorer/src/app/evidence/page.tsx',
    'packages/ledger-ui/src/ledger.tsx',
  ];

  it.each(currentSurfaces)('%s does not direct adopters to the predecessor repository', (path) => {
    expect(readRepo(path)).not.toMatch(/https:\/\/github\.com\/auths-dev\/auths(?![-/])/);
  });

  it('links the primary navigation to the current repository', () => {
    expect(read('components/site-nav.tsx')).toContain(
      'href="https://github.com/auths-dev/auths-proof"',
    );
  });
});
