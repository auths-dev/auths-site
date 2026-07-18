// mcp.mjs — the MCP wire (newline-delimited JSON-RPC 2.0 over child stdio) and the
// treasury TCP RPC. Lifted from tests/e2e/fleet-throughput.mjs and deduped so every
// scenario shares one implementation instead of copy-pasting it.

import { spawn } from 'node:child_process';
import { connect } from 'node:net';

/** Processes to SIGKILL on teardown; scenarios push their children here. */
export const children = [];

export function killAllChildren() {
  for (const c of children) { try { c.kill('SIGKILL'); } catch { /* already gone */ } }
}

/** One newline-JSON request to the treasury coordinator, one line back. */
export function treasuryRpc(port, request) {
  return new Promise((resolveP, rejectP) => {
    const sock = connect(port, '127.0.0.1');
    let buf = '';
    sock.on('data', (d) => {
      buf += d;
      if (buf.includes('\n')) { sock.end(); try { resolveP(JSON.parse(buf)); } catch (e) { rejectP(e); } }
    });
    sock.on('error', rejectP);
    sock.write(`${JSON.stringify(request)}\n`);
  });
}

/** Minimal MCP client over a spawned child's stdio. Matches responses by JSON-RPC id. */
export class StdioMcp {
  constructor(command, args, env) {
    this.child = spawn(command, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    children.push(this.child);
    this.buf = '';
    this.pending = new Map();
    this.nextId = 1;
    this.stderr = '';
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk) => {
      this.buf += chunk;
      let nl;
      while ((nl = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, nl).trim();
        this.buf = this.buf.slice(nl + 1);
        if (!line) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined && this.pending.has(msg.id)) {
            this.pending.get(msg.id)(msg);
            this.pending.delete(msg.id);
          }
        } catch { /* non-JSON stdout line */ }
      }
    });
    this.child.stderr.setEncoding('utf8');
    // Keep only a bounded stderr tail — a long storm would otherwise grow this unbounded.
    this.child.stderr.on('data', (c) => { this.stderr = (this.stderr + c).slice(-4000); });
  }

  request(method, params, timeoutMs = 120_000) {
    const id = this.nextId++;
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    return new Promise((resolveP, rejectP) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        rejectP(new Error(`${method} timed out (stderr tail: ${this.stderr.slice(-300)})`));
      }, timeoutMs);
      this.pending.set(id, (m) => { clearTimeout(t); resolveP(m); });
    });
  }

  notify(method) {
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method })}\n`);
  }

  kill() { try { this.child.kill('SIGKILL'); } catch { /* gone */ } }
}
