import { describe, it, expect } from 'vitest';
import {
  VERIFY_SPEND_CMD,
  VERIFY_TAMPERED_CMD,
  DEMO_VERIFY_CMD,
  RUN_WITNESS,
} from '../lib/demo-commands';

const firstCommandLine = (block: string): string =>
  block.split('\n').find((line) => line.startsWith('npx -y @auths-dev/mcp')) ?? '';

describe('verify-spend copy strings survive a literal paste', () => {
  for (const [name, cmd] of Object.entries({ VERIFY_SPEND_CMD, VERIFY_TAMPERED_CMD })) {
    it(`${name} names the published binary and carries no angle-bracket placeholder`, () => {
      expect(cmd.startsWith('npx -y @auths-dev/mcp')).toBe(true);
      expect(cmd.includes('<')).toBe(false);
      expect(cmd.includes('auths-mcp-gateway')).toBe(false);
    });
  }

  it('interpolates the real demo identifiers rather than placeholders', () => {
    expect(VERIFY_SPEND_CMD).toContain('--agent did:keri:');
    expect(VERIFY_SPEND_CMD).toContain('--root did:keri:');
  });
});

describe('the /trust demo command', () => {
  it('is angle-bracket free and reaches the published binary on its command line', () => {
    expect(DEMO_VERIFY_CMD.includes('<')).toBe(false);
    expect(firstCommandLine(DEMO_VERIFY_CMD).startsWith('npx -y @auths-dev/mcp')).toBe(true);
    expect(DEMO_VERIFY_CMD).toContain('tar xzf demo-bundle.tgz');
  });
});

describe('the /network witness command', () => {
  it('copies every displayed line of the run sequence', () => {
    expect(RUN_WITNESS).toContain('git clone');
    expect(RUN_WITNESS).toContain('cd auths/deploy/witness');
    expect(RUN_WITNESS).toContain('docker compose up -d');
    expect(RUN_WITNESS).toContain('witness-conformance');
    expect(RUN_WITNESS.includes('<')).toBe(false);
  });
});
