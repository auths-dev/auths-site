#!/usr/bin/env node
// The directory as an MCP server (US-009): agents discover paid endpoints
// the same way they'll call them. Dependency-free newline-delimited
// JSON-RPC over stdio, backed by the public read API. Publishable as
// @auths-dev/market-directory; priced at $0 and listable on itself.
//
// Config: MARKET_API_BASE (default https://market.auths.dev)
//         AUTHS_BIN        (default `auths` on PATH) — the write tools present
//         the agent's own credential through the local auths CLI.

import { execFileSync } from 'node:child_process';

const BASE = process.env.MARKET_API_BASE ?? 'https://market.auths.dev';
const AUTHS = process.env.AUTHS_BIN ?? 'auths';
const PROTOCOL_VERSION = '2024-11-05';

const TOOLS = [
  {
    name: 'search_endpoints',
    description:
      'List live, verified paid MCP endpoints. Optional rail filter ("x402" or "stripe").',
    inputSchema: {
      type: 'object',
      properties: { rail: { type: 'string', enum: ['x402', 'stripe'] } },
    },
  },
  {
    name: 'get_endpoint',
    description: 'Full detail for one endpoint by slug: tools, price, badges, receipts pointers.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
  },
  {
    name: 'create_listing',
    description:
      'List a paid endpoint as the local agent: mints a server challenge, presents the '
      + 'named market:sell credential through the auths CLI, and POSTs the listing — the '
      + 'full challenge → presentation → write flow, no human anywhere.',
    inputSchema: {
      type: 'object',
      properties: {
        credential_said: { type: 'string', description: 'SAID of a credential granting market:sell' },
        subject_alias: { type: 'string', description: 'local signing alias (default "main")' },
        listing: {
          type: 'object',
          description: 'slug, name, description, priceCents, rails, transport, endpointValue (BARE downstream command), attestationUrl (activity/v1), docsUrl, tools',
        },
      },
      required: ['credential_said', 'listing'],
    },
  },
  {
    name: 'my_listings',
    description:
      'The presented agent\'s own listings with status, fail_reason, verified_at, and '
      + 'live_proven_at — the same challenge → presentation flow as create_listing.',
    inputSchema: {
      type: 'object',
      properties: {
        credential_said: { type: 'string' },
        subject_alias: { type: 'string' },
      },
      required: ['credential_said'],
    },
  },
  {
    name: 'get_integration',
    description:
      'The exact wrap command (test-mode and live) to call an endpoint under your own budget, '
      + 'plus example_call — a runnable metered tools/call whose arguments carry amount_atomic '
      + 'derived from the listing price_cents.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
  },
];

async function callTool(name, args) {
  if (name === 'search_endpoints') {
    const q = args?.rail ? `?rail=${args.rail}` : '';
    const res = await fetch(`${BASE}/api/v1/endpoints${q}`);
    return await res.json();
  }
  if (name === 'get_endpoint') {
    const res = await fetch(`${BASE}/api/v1/endpoints/${encodeURIComponent(args.slug)}`);
    return await res.json();
  }
  if (name === 'get_integration') {
    const res = await fetch(`${BASE}/api/v1/endpoints/${encodeURIComponent(args.slug)}`);
    const detail = await res.json();
    return detail.integration ?? detail;
  }
  if (name === 'create_listing') {
    const presented = await presentCredential(args);
    const res = await fetch(`${BASE}/api/v1/listings`, {
      method: 'POST',
      headers: { authorization: presented.authorization, 'content-type': 'application/json' },
      body: JSON.stringify({ evidence: presented.evidence, listing: args.listing ?? {} }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`listing refused (${res.status}): ${JSON.stringify(body.error ?? body)}`);
    return body;
  }
  if (name === 'my_listings') {
    const presented = await presentCredential(args);
    const res = await fetch(`${BASE}/api/v1/me/listings`, {
      method: 'POST',
      headers: { authorization: presented.authorization, 'content-type': 'application/json' },
      body: JSON.stringify({ evidence: presented.evidence }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`me/listings refused (${res.status}): ${JSON.stringify(body.error ?? body)}`);
    return body;
  }
  throw new Error(`unknown tool: ${name}`);
}

// Challenge → presentation, through the agent's own auths CLI: the server mints a
// single-use nonce and the CLI signs the presentation over it (with evidence), so
// the directory never touches key material.
async function presentCredential(args) {
  const challengeRes = await fetch(`${BASE}/api/v1/challenge`, { method: 'POST' });
  const challenge = await challengeRes.json();
  if (!challenge?.nonce) throw new Error('challenge mint failed');
  const audience = new URL(BASE).host;
  const out = execFileSync(AUTHS, [
    '--json', 'credential', 'present',
    '--subject', args.subject_alias ?? 'main',
    '--said', args.credential_said,
    '--audience', audience,
    '--nonce', challenge.nonce,
    '--with-evidence',
  ], { encoding: 'utf8' });
  const parsed = JSON.parse(out);
  const data = parsed.data ?? parsed;
  if (!data.authorization || !data.evidence) {
    throw new Error('auths credential present returned no authorization/evidence');
  }
  return data;
}

function reply(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function replyError(id, message) {
  process.stdout.write(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32000, message } }) + '\n',
  );
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    handle(msg);
  }
});

async function handle(msg) {
  if (msg.method === 'initialize') {
    reply(msg.id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: 'auths-market-directory', version: '0.1.0' },
    });
  } else if (msg.method === 'tools/list') {
    reply(msg.id, { tools: TOOLS });
  } else if (msg.method === 'tools/call') {
    try {
      const result = await callTool(msg.params?.name, msg.params?.arguments);
      reply(msg.id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
    } catch (e) {
      replyError(msg.id, e.message);
    }
  } else if (msg.id !== undefined) {
    replyError(msg.id, `unsupported method: ${msg.method}`);
  }
}
