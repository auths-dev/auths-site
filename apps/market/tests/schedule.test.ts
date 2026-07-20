import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { PROBE_SCHEDULE, STATUS_LABEL } from '@/lib/schedule';

describe('probe schedule copy', () => {
  it('the pending label carries the cadence so copy and cron cannot drift', () => {
    expect(STATUS_LABEL.pending_verification).toContain(PROBE_SCHEDULE);
  });

  it('the stated cadence matches the daily 06:00 UTC probe cron in vercel.json', () => {
    const vercel = JSON.parse(
      readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
    ) as { crons: { path: string; schedule: string }[] };
    const probe = vercel.crons.find((c) => c.path === '/api/cron/probe');
    expect(probe).toBeDefined();
    const hour = probe!.schedule.split(' ')[1];
    expect(hour).toBe('6');
    expect(PROBE_SCHEDULE).toContain('06:00 UTC');
    expect(PROBE_SCHEDULE).toContain('daily');
  });
});
