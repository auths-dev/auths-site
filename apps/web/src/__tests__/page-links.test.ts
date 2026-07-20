import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string): string => readFileSync(join(SRC, rel), 'utf8');

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
