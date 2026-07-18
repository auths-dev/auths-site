#!/usr/bin/env node
/**
 * Dev seed: one demo seller + one demo listing, via the service role.
 * The listing is explicitly labeled a seed fixture — the prober is the only
 * thing that verifies real listings. Idempotent.
 *
 * Run: node scripts/seed-demo.mjs   (reads ../.env.local)
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const HERE = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(join(HERE, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const EMAIL = 'seed-demo@auths.dev';

let userId;
const { data: existing } = await supabase.auth.admin.listUsers();
const found = existing?.users?.find((u) => u.email === EMAIL);
if (found) {
  userId = found.id;
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    email_confirm: true,
    user_metadata: { user_name: 'auths-demo' },
  });
  if (error) throw new Error(`createUser: ${error.message}`);
  userId = data.user.id;
}

await supabase.from('sellers').upsert({
  id: userId,
  auth_provider: 'github',
  auth_subject: 'seed-demo',
  github_login: 'auths-dev',
});

const { error: listErr } = await supabase.from('listings').upsert(
  {
    seller_id: userId,
    slug: 'demo-echo',
    name: 'Demo echo (seed fixture)',
    description:
      'A seed-data listing for development. Echoes its input back, metered at three cents a call on the x402 test rail. Replaced by real probed listings before launch.',
    tools: [
      { name: 'echo', description: 'returns the input, metered' },
      { name: 'shout', description: 'returns the input uppercased, metered' },
    ],
    price_cents: 3,
    rails: ['x402'],
    endpoint: { transport: 'stdio', command: 'npx -y @auths-dev/demo-echo' },
    spend_log_url: 'https://raw.githubusercontent.com/auths-dev/auths-mcp/main/examples/replay/transcript.json',
    docs_url: 'https://docs.auths.dev/',
    status: 'live',
    verified_at: new Date().toISOString(),
  },
  { onConflict: 'slug' },
);
if (listErr) throw new Error(`listing upsert: ${listErr.message}`);

console.log(`seeded: seller ${userId}, listing demo-echo (live)`);
