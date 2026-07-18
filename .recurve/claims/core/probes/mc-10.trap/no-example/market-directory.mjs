#!/usr/bin/env node
// The directory as an MCP server (US-009): agents discover paid endpoints
// the same way they'll call them. Dependency-free newline-delimited
// JSON-RPC over stdio, backed by the public read API. Publishable as
// @auths-dev/market-directory; priced at $0 and listable on itself.
//
// Config: MARKET_API_BASE (default https://market.auths.dev)

const BASE = process.env.MARKET_API_BASE ?? 'https://market.auths.dev';
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
    name: 'get_integration',
    description:
      'The exact wrap command (test-mode and live) to call an endpoint under your own budget.',
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
  throw new Error(`unknown tool: ${name}`);
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
