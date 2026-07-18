// metrics.mjs — the measurement primitives every scenario reports through.
//
//   Recorder        per-call latency reservoir + verdict tallies + a histogram + summary
//   ThroughputTape  wall-clock-bucketed completion counts (throughput-over-time series)
//   ResourceSampler periodic aggregate RSS / %CPU of a set of PIDs (macOS `ps`)
//
// Nothing here estimates or fabricates — every number is derived from observed samples.

import { execFile } from 'node:child_process';

const nowMs = () => Number(process.hrtime.bigint()) / 1e6;

export function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return null;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1));
  return sortedAsc[idx];
}

/** Latency + verdict recorder for one measured phase. */
export class Recorder {
  constructor() {
    this.latencies = [];              // ms, one per completed call
    this.verdicts = { granted: 0, refused: 0, error: 0 };
    this.errors = [];                 // bounded sample of error strings
  }

  record(latencyMs, verdict) {
    this.latencies.push(latencyMs);
    if (verdict === 'granted') this.verdicts.granted += 1;
    else if (verdict === 'refused') this.verdicts.refused += 1;
    else this.verdicts.error += 1;
  }

  noteError(msg) { if (this.errors.length < 20) this.errors.push(String(msg).slice(0, 300)); }

  /** A log-ish histogram over the latency samples: fixed bucket edges in ms. */
  histogram(edges = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 4096]) {
    const bins = edges.map((hi, i) => ({ lo: i === 0 ? 0 : edges[i - 1], hi, count: 0 }));
    const overflow = { lo: edges[edges.length - 1], hi: Infinity, count: 0 };
    for (const v of this.latencies) {
      const bin = bins.find((b) => v <= b.hi);
      if (bin) bin.count += 1; else overflow.count += 1;
    }
    return [...bins, overflow];
  }

  summary() {
    const s = [...this.latencies].sort((a, b) => a - b);
    const n = s.length;
    const mean = n ? s.reduce((a, b) => a + b, 0) / n : null;
    return {
      calls: n,
      verdicts: { ...this.verdicts },
      latency_ms: {
        min: n ? s[0] : null,
        p50: percentile(s, 50),
        p90: percentile(s, 90),
        p95: percentile(s, 95),
        p99: percentile(s, 99),
        max: n ? s[n - 1] : null,
        mean,
      },
      errors_sample: this.errors,
    };
  }
}

/** Bucketed completion counts → a throughput-over-time series (calls per bucket). */
export class ThroughputTape {
  constructor(bucketMs = 250) {
    this.bucketMs = bucketMs;
    this.t0 = nowMs();
    this.buckets = new Map();          // bucketIndex → count
  }

  mark() {
    const idx = Math.floor((nowMs() - this.t0) / this.bucketMs);
    this.buckets.set(idx, (this.buckets.get(idx) ?? 0) + 1);
  }

  /** [{ t_ms, cps }] — one point per bucket, throughput = count / bucketSeconds. */
  series() {
    const maxIdx = Math.max(0, ...this.buckets.keys());
    const secs = this.bucketMs / 1000;
    const out = [];
    for (let i = 0; i <= maxIdx; i += 1) {
      out.push({ t_ms: Math.round(i * this.bucketMs), cps: (this.buckets.get(i) ?? 0) / secs });
    }
    return out;
  }
}

/** Sample aggregate resident memory + CPU% of a set of PIDs on a fixed cadence. */
export class ResourceSampler {
  constructor(pidsFn, intervalMs = 500) {
    this.pidsFn = pidsFn;              // () => number[]  (live pids to sample)
    this.intervalMs = intervalMs;
    this.samples = [];                 // [{ t_ms, rss_mb, cpu_pct, procs }]
    this.t0 = nowMs();
    this.timer = null;
  }

  start() {
    const tick = () => {
      const pids = this.pidsFn().filter(Boolean);
      if (pids.length === 0) { this.timer = setTimeout(tick, this.intervalMs); return; }
      execFile('ps', ['-o', 'rss=,%cpu=', '-p', pids.join(',')], (err, stdout) => {
        if (!err && stdout) {
          let rssKb = 0; let cpu = 0; let procs = 0;
          for (const line of stdout.trim().split('\n')) {
            const [rss, pcpu] = line.trim().split(/\s+/);
            if (rss !== undefined) { rssKb += Number(rss) || 0; cpu += Number(pcpu) || 0; procs += 1; }
          }
          this.samples.push({
            t_ms: Math.round(nowMs() - this.t0),
            rss_mb: Math.round(rssKb / 1024),
            cpu_pct: Math.round(cpu),
            procs,
          });
        }
        this.timer = setTimeout(tick, this.intervalMs);
      });
    };
    this.timer = setTimeout(tick, this.intervalMs);
  }

  stop() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } }
}

/** Run `thunk` at bounded concurrency across `items`; returns results in input order. */
export async function pool(items, limit, thunk) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await thunk(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
