import { NextResponse, type NextRequest } from 'next/server';
import { deriveAll } from '@/lib/receipts-worker';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: { code: 'unauthorized' } }, { status: 401 });
  }
  const result = await deriveAll();
  return NextResponse.json(result);
}
