import { NextResponse, type NextRequest } from 'next/server';
import { probePending } from '@/lib/prober';

export const maxDuration = 300;

/** Vercel cron entrypoint; Fly/CI can run scripts/run-prober.mjs instead. */
export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: { code: 'unauthorized' } }, { status: 401 });
  }
  const result = await probePending();
  return NextResponse.json(result);
}
