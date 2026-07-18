// scrape.mjs — read the gateway's own Prometheus /metrics surface (#7 dogfood).
//
// The harness measures each call EXTERNALLY (latency, verdict). The gateway now also counts
// them INTERNALLY via the metrics it emits on the hot path. Scraping /metrics and comparing
// the two is the dogfood: the gateway's self-reported calls_total must equal what the harness
// actually drove — proving the new observability surface is wired correctly and load-bearing.

import http from 'node:http';

/** GET http://127.0.0.1:<port>/metrics and parse the Prometheus exposition. */
export function scrapeMetrics(port, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/metrics', timeout: timeoutMs }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve(parsePrometheus(body)));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`scrape :${port} timed out`)); });
  });
}

/** Parse Prometheus text into { 'name{labels}': value } (comment/HELP lines ignored). */
export function parsePrometheus(text) {
  const out = {};
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([a-zA-Z_:][^\s{]*)(\{[^}]*\})?\s+([0-9.eE+-]+)$/);
    if (m) out[m[1] + (m[2] ?? '')] = Number(m[3]);
  }
  return out;
}

/** Sum every series of a metric family (all label sets) by name. */
export function sumFamily(parsed, name) {
  let total = 0;
  for (const key of Object.keys(parsed)) {
    if (key === name || key.startsWith(`${name}{`)) total += parsed[key];
  }
  return total;
}

/** Value of one metric at a specific single label, or 0 if absent. */
export function atLabel(parsed, name, label, value) {
  return parsed[`${name}{${label}="${value}"}`] ?? 0;
}
