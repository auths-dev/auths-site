import { NextResponse } from 'next/server';
import { readdirSync, existsSync } from 'node:fs';

/**
 * Temporary diagnostic: report the deployed function's filesystem view so the
 * vendored-addon path probing can be grounded in facts. CRON-secret gated;
 * removed once the verifier loads in production.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const cwd = process.cwd();
  const probe = (p: string) => ({ path: p, exists: existsSync(p) });
  const list = (p: string) => {
    try {
      return readdirSync(p).slice(0, 40);
    } catch (e) {
      return `unreadable: ${(e as Error).message}`;
    }
  };
  return NextResponse.json({
    cwd,
    dirname: __dirname,
    cwdEntries: list(cwd),
    probes: [
      probe(`${cwd}/vendor/auths-sdk/node_modules/@auths-dev/sdk`),
      probe(`${cwd}/apps/market/vendor/auths-sdk/node_modules/@auths-dev/sdk`),
      probe(`${cwd}/node_modules/@auths-dev/sdk`),
      probe(`${cwd}/apps/market/node_modules/@auths-dev/sdk`),
      probe('/var/task/vendor/auths-sdk/node_modules/@auths-dev/sdk'),
    ],
    varTask: list('/var/task'),
    varTaskMarket: list('/var/task/apps/market'),
  });
}
