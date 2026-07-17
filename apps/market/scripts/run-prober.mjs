#!/usr/bin/env node
// Standalone prober runner (Fly/CI fallback per PRD §7.4). Reads .env.local.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(join(HERE, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { probePending } = await import('../src/lib/prober.ts');
console.log(await probePending());
