import { describe, it, expect } from 'vitest';
import { endpointCommand, TEST_MODE_NOTE, wrapCommand } from '@/lib/integration';
import { makeListing } from './fixtures';

describe('endpointCommand', () => {
  it('interpolates a url-transport listing into a paste-clean mcp-remote command', () => {
    const cmd = endpointCommand(
      makeListing({ endpoint: { transport: 'url', url: 'https://x.example/mcp' } }),
    );
    expect(cmd.startsWith('npx -y mcp-remote ')).toBe(true);
    expect(cmd).toContain('https://x.example/mcp');
    expect(cmd).not.toContain('<');
  });

  it('flags a bare stdio binary a buyer cannot fetch with an install hint', () => {
    const cmd = endpointCommand(
      makeListing({ endpoint: { transport: 'stdio', command: 'auths-receipts-server' } }),
    );
    expect(cmd).toContain('install the server first');
    expect(cmd).toContain('auths-receipts-server');
  });

  it('passes a self-fetching npx stdio command through unchanged', () => {
    const cmd = endpointCommand(
      makeListing({
        endpoint: { transport: 'stdio', command: 'npx -y @auths-dev/receipts-server' },
      }),
    );
    expect(cmd).toBe('npx -y @auths-dev/receipts-server');
  });
});

describe('test-mode integration disclosure', () => {
  it('names the recorded-fixture caveat and denies a real settle claim', () => {
    expect(TEST_MODE_NOTE).toContain('recorded fixtures');
    expect(TEST_MODE_NOTE).toContain('not a real on-chain settle');
  });

  it('still carries --test-mode in the test-mode command', () => {
    expect(wrapCommand('x402', 'npx -y mcp-remote https://x.example/mcp', true)).toContain(
      '--test-mode',
    );
    expect(wrapCommand('x402', 'npx -y mcp-remote https://x.example/mcp', false)).not.toContain(
      '--test-mode',
    );
  });
});
