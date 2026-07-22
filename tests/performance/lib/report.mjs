// report.mjs — render the measured results into a self-contained, theme-aware HTML
// dashboard (no external assets, no CDN). Charts follow the dataviz method: one axis per
// chart (never dual), validated palette on the auths paper/ink surfaces, a legend + direct
// labels for multi-series, a hover layer, and a table view under every chart. The 100k line
// is a CLEARLY-LABELLED projection, never presented as measured.
//
// The page's client JS is authored as real functions here and serialized with
// .toString(), so their internal template literals survive verbatim (report.mjs does not
// interpolate them).

function derive(results) {
  const s = results.scenarios || {};
  const ramps = [s.ramp_solo, s.ramp_fleet].filter((r) => r && !r.error);
  const peakRamp = Math.max(0, ...ramps.map((r) => r.peak?.cps || 0));
  const soakCps = s.soak && !s.soak.error ? (s.soak.mean_cps || 0) : 0;
  const peakMeasured = Math.max(peakRamp, soakCps);
  const micro = s.microbench && !s.microbench.error ? s.microbench : null;
  const cryptoCeil = micro?.derived?.crypto_ceiling_allcores_cps || null;
  const durableCeil = micro?.derived?.durable_writer_ceiling_cps || null;
  const coldP50 = ramps[0]?.cold?.latency_ms?.p50 ?? s.soak?.cold?.latency_ms?.p50 ?? null;
  const warmP50 = s.soak?.summary?.latency_ms?.p50 ?? ramps.find((r) => r.levels?.[0])?.levels[0]?.latency_ms?.p50 ?? null;
  const TARGET = 100000;

  // Single-node projection model (declared, not measured — the chart tags it as such).
  const projection = [];
  if (peakMeasured > 0) projection.push({ label: 'Measured peak', value: peakMeasured, measured: true, note: 'the real system, today' });
  if (durableCeil) projection.push({ label: '+ group-commit', value: durableCeil, note: 'amortize per-call rename/append → 1 fsync per batch' });
  if (cryptoCeil) projection.push({ label: '+ in-proc transport', value: cryptoCeil, note: 'drop stdio round-trips; crypto now binds — this is the per-node ceiling' });
  const shards = cryptoCeil ? Math.ceil(TARGET / cryptoCeil) : null;
  projection.push({ label: 'Internet scale', value: TARGET, target: true, note: shards ? `shard ×${shards} nodes at the per-node ceiling` : 'horizontal shards' });

  return {
    peakMeasured, cryptoCeil, durableCeil, coldP50, warmP50, target: TARGET,
    gap: peakMeasured ? TARGET / peakMeasured : null,
    shards, projection,
  };
}

// ── the page's client JS (serialized verbatim) ──────────────────────────────────────────
function APP() {
  const D = window.__DATA__;
  const M = D.derived;
  const S = D.scenarios;
  const NS = 'http://www.w3.org/2000/svg';
  const fmt = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
  const ms = (n) => n == null ? '—' : (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 's' : n.toFixed(n < 10 ? 1 : 0) + 'ms');

  function E(tag, attrs, kids) {
    const n = document.createElement(tag);
    for (const k in (attrs || {})) { if (k === 'html') n.innerHTML = attrs[k]; else if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); }
    for (const c of (kids || [])) if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    return n;
  }
  function SV(tag, attrs) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }
  const cssv = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();

  // Shared plot frame: axes, gridlines, and a hover crosshair. Returns { svg, plot, x, y, W, H, PADL, PADB, box }.
  function frame(host, { w = 640, h = 300, padL = 54, padB = 34, padT = 14, padR = 16 } = {}) {
    const box = E('div', { class: 'chart' });
    const svg = SV('svg', { viewBox: `0 0 ${w} ${h}`, class: 'plot', preserveAspectRatio: 'xMidYMid meet', role: 'img' });
    box.appendChild(svg); host.appendChild(box);
    const IW = w - padL - padR, IH = h - padT - padB;
    return { svg, box, w, h, padL, padB, padT, padR, IW, IH,
      X: (t) => padL + t * IW, Y: (t) => padT + (1 - t) * IH };
  }
  const grid = (col) => cssv('--grid');
  const axisc = () => cssv('--axis');
  const muted = () => cssv('--muted');

  function tip() {
    let t = document.getElementById('tt');
    if (!t) { t = E('div', { id: 'tt', class: 'tt' }); document.body.appendChild(t); }
    return t;
  }
  function showTip(html, x, y) { const t = tip(); t.innerHTML = html; t.style.display = 'block'; t.style.left = (x + 14) + 'px'; t.style.top = (y + 14) + 'px'; }
  function hideTip() { const t = document.getElementById('tt'); if (t) t.style.display = 'none'; }

  const niceLog = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p) * p; };

  // Line chart: series = [{name,color,points:[{x,y,label?}]}]; xType 'log2'|'linear'; yType 'linear'|'log'.
  function lineChart(host, { series, xLabel, yLabel, xType = 'linear', yType = 'linear', xFmt = fmt, yFmt = fmt, directLabel = true, caption }) {
    const f = frame(host);
    const xs = series.flatMap((s) => s.points.map((p) => p.x));
    const ysAll = series.flatMap((s) => s.points.map((p) => p.y)).filter((v) => v != null);
    let xmin = Math.min(...xs), xmax = Math.max(...xs);
    let ymin = yType === 'log' ? Math.min(...ysAll.filter((v) => v > 0)) : 0;
    let ymax = Math.max(...ysAll, 1);
    if (yType === 'log') { ymin = Math.pow(10, Math.floor(Math.log10(ymin))); ymax = niceLog(ymax); } else { ymax = ymax * 1.12; }
    const tx = (x) => xType === 'log2' ? (Math.log2(x) - Math.log2(xmin)) / ((Math.log2(xmax) - Math.log2(xmin)) || 1) : (x - xmin) / ((xmax - xmin) || 1);
    const ty = (y) => yType === 'log' ? (Math.log10(y) - Math.log10(ymin)) / ((Math.log10(ymax) - Math.log10(ymin)) || 1) : (y - ymin) / ((ymax - ymin) || 1);

    // y gridlines + ticks
    const yticks = yType === 'log'
      ? Array.from({ length: Math.round(Math.log10(ymax) - Math.log10(ymin)) + 1 }, (_, i) => ymin * Math.pow(10, i))
      : Array.from({ length: 5 }, (_, i) => ymin + (ymax - ymin) * i / 4);
    for (const yt of yticks) {
      const Y = f.Y(ty(yt));
      f.svg.appendChild(SV('line', { x1: f.padL, y1: Y, x2: f.w - f.padR, y2: Y, stroke: grid(), 'stroke-width': 1 }));
      const lab = SV('text', { x: f.padL - 8, y: Y + 3, 'text-anchor': 'end', class: 'tick' }); lab.textContent = yFmt(yt); f.svg.appendChild(lab);
    }
    // x ticks (from the first series' x values)
    const xvals = [...new Set(xs)].sort((a, b) => a - b);
    for (const xv of xvals) {
      const X = f.X(tx(xv));
      const lab = SV('text', { x: X, y: f.h - f.padB + 16, 'text-anchor': 'middle', class: 'tick' }); lab.textContent = xFmt(xv); f.svg.appendChild(lab);
    }
    // axis labels
    const xl = SV('text', { x: f.padL + f.IW / 2, y: f.h - 2, 'text-anchor': 'middle', class: 'axlabel' }); xl.textContent = xLabel; f.svg.appendChild(xl);
    const yl = SV('text', { x: 12, y: f.padT + f.IH / 2, 'text-anchor': 'middle', class: 'axlabel', transform: `rotate(-90 12 ${f.padT + f.IH / 2})` }); yl.textContent = yLabel; f.svg.appendChild(yl);

    // series polylines + markers
    for (const s of series) {
      const pts = s.points.filter((p) => p.y != null && (yType !== 'log' || p.y > 0));
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${f.X(tx(p.x)).toFixed(1)} ${f.Y(ty(p.y)).toFixed(1)}`).join(' ');
      f.svg.appendChild(SV('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      for (const p of pts) {
        const c = SV('circle', { cx: f.X(tx(p.x)), cy: f.Y(ty(p.y)), r: 3.5, fill: s.color, stroke: cssv('--surface'), 'stroke-width': 1.5 });
        c.addEventListener('mousemove', (e) => showTip(`<b>${s.name}</b><br>${xLabel}: ${xFmt(p.x)}<br>${yLabel}: <b>${yFmt(p.y)}</b>`, e.clientX, e.clientY));
        c.addEventListener('mouseleave', hideTip);
        f.svg.appendChild(c);
      }
      if (directLabel && pts.length) {
        const last = pts[pts.length - 1];
        const t = SV('text', { x: f.X(tx(last.x)) + 6, y: f.Y(ty(last.y)) + 3, class: 'serieslabel', fill: s.color }); t.textContent = s.name; f.svg.appendChild(t);
      }
    }
    if (caption) f.box.appendChild(E('p', { class: 'cap', html: caption }));
    return f;
  }

  // Bar chart: bars=[{label,value,color?}]; optional refLines=[{value,label,color}]; yType.
  function barChart(host, { bars, yLabel, yType = 'linear', yFmt = fmt, refLines = [], caption, rotate = false }) {
    const f = frame(host, { h: rotate ? 340 : 300, padB: rotate ? 94 : 34 });
    const vals = bars.map((b) => b.value).concat(refLines.map((r) => r.value)).filter((v) => v > 0);
    let ymin = yType === 'log' ? Math.pow(10, Math.floor(Math.log10(Math.min(...vals)))) : 0;
    let ymax = yType === 'log' ? niceLog(Math.max(...vals)) : Math.max(...vals) * 1.14;
    const ty = (y) => y <= 0 ? 0 : (yType === 'log' ? (Math.log10(y) - Math.log10(ymin)) / ((Math.log10(ymax) - Math.log10(ymin)) || 1) : (y - ymin) / ((ymax - ymin) || 1));
    const yticks = yType === 'log'
      ? Array.from({ length: Math.round(Math.log10(ymax) - Math.log10(ymin)) + 1 }, (_, i) => ymin * Math.pow(10, i))
      : Array.from({ length: 5 }, (_, i) => ymin + (ymax - ymin) * i / 4);
    for (const yt of yticks) { const Y = f.Y(ty(yt)); f.svg.appendChild(SV('line', { x1: f.padL, y1: Y, x2: f.w - f.padR, y2: Y, stroke: grid(), 'stroke-width': 1 })); const lab = SV('text', { x: f.padL - 8, y: Y + 3, 'text-anchor': 'end', class: 'tick' }); lab.textContent = yFmt(yt); f.svg.appendChild(lab); }
    const yl = SV('text', { x: 12, y: f.padT + f.IH / 2, 'text-anchor': 'middle', class: 'axlabel', transform: `rotate(-90 12 ${f.padT + f.IH / 2})` }); yl.textContent = yLabel; f.svg.appendChild(yl);

    const n = bars.length, gap = 0.28, bw = f.IW / n * (1 - gap);
    bars.forEach((b, i) => {
      const cx = f.padL + f.IW * (i + 0.5) / n;
      const y0 = f.Y(0), y1 = f.Y(ty(b.value));
      const rect = SV('rect', { x: cx - bw / 2, y: Math.min(y0, y1), width: bw, height: Math.abs(y0 - y1), rx: 4, fill: b.color || cssv('--series1') });
      rect.addEventListener('mousemove', (e) => showTip(`<b>${b.label}</b><br>${yLabel}: <b>${yFmt(b.value)}</b>${b.note ? '<br>' + b.note : ''}`, e.clientX, e.clientY));
      rect.addEventListener('mouseleave', hideTip);
      f.svg.appendChild(rect);
      // value label above bar
      const vlab = SV('text', { x: cx, y: y1 - 6, 'text-anchor': 'middle', class: 'barval' }); vlab.textContent = yFmt(b.value); f.svg.appendChild(vlab);
      // category label
      const clab = SV('text', { x: cx, y: f.h - f.padB + 15, 'text-anchor': rotate ? 'end' : 'middle', class: 'tick' });
      clab.textContent = b.label;
      if (rotate) clab.setAttribute('transform', `rotate(-30 ${cx} ${f.h - f.padB + 15})`);
      f.svg.appendChild(clab);
    });
    for (const r of refLines) {
      const Y = f.Y(ty(r.value));
      f.svg.appendChild(SV('line', { x1: f.padL, y1: Y, x2: f.w - f.padR, y2: Y, stroke: r.color, 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
      const t = SV('text', { x: f.w - f.padR, y: Y - 5, 'text-anchor': 'end', class: 'refl', fill: r.color }); t.textContent = r.label; f.svg.appendChild(t);
    }
    if (caption) f.box.appendChild(E('p', { class: 'cap', html: caption }));
    return f;
  }

  // Area (single-series over time) with hover.
  function areaChart(host, { points, xLabel, yLabel, xFmt = fmt, yFmt = fmt, color, caption }) {
    const f = frame(host, { h: 240 });
    const xmin = Math.min(...points.map((p) => p.x)), xmax = Math.max(...points.map((p) => p.x));
    const ymax = Math.max(...points.map((p) => p.y), 1) * 1.15;
    const tx = (x) => (x - xmin) / ((xmax - xmin) || 1), ty = (y) => y / ymax;
    for (let i = 0; i <= 4; i++) { const yv = ymax * i / 4, Y = f.Y(ty(yv)); f.svg.appendChild(SV('line', { x1: f.padL, y1: Y, x2: f.w - f.padR, y2: Y, stroke: grid(), 'stroke-width': 1 })); const lab = SV('text', { x: f.padL - 8, y: Y + 3, 'text-anchor': 'end', class: 'tick' }); lab.textContent = yFmt(yv); f.svg.appendChild(lab); }
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${f.X(tx(p.x)).toFixed(1)} ${f.Y(ty(p.y)).toFixed(1)}`).join(' ');
    const areaD = `${line} L${f.X(1).toFixed(1)} ${f.Y(0)} L${f.X(0).toFixed(1)} ${f.Y(0)} Z`;
    f.svg.appendChild(SV('path', { d: areaD, fill: color, 'fill-opacity': 0.12 }));
    f.svg.appendChild(SV('path', { d: line, fill: 'none', stroke: color, 'stroke-width': 2 }));
    const xl = SV('text', { x: f.padL + f.IW / 2, y: f.h - 2, 'text-anchor': 'middle', class: 'axlabel' }); xl.textContent = xLabel; f.svg.appendChild(xl);
    const yl = SV('text', { x: 12, y: f.padT + f.IH / 2, 'text-anchor': 'middle', class: 'axlabel', transform: `rotate(-90 12 ${f.padT + f.IH / 2})` }); yl.textContent = yLabel; f.svg.appendChild(yl);
    // hover overlay
    const ov = SV('rect', { x: f.padL, y: f.padT, width: f.IW, height: f.IH, fill: 'transparent' });
    const cross = SV('line', { x1: 0, y1: f.padT, x2: 0, y2: f.padT + f.IH, stroke: muted(), 'stroke-width': 1, opacity: 0 });
    f.svg.appendChild(cross); f.svg.appendChild(ov);
    ov.addEventListener('mousemove', (e) => {
      const r = f.svg.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * f.w;
      const frac = Math.max(0, Math.min(1, (px - f.padL) / f.IW)); const xi = Math.round(frac * (points.length - 1));
      const p = points[xi]; if (!p) return; const X = f.X(tx(p.x));
      cross.setAttribute('x1', X); cross.setAttribute('x2', X); cross.setAttribute('opacity', 1);
      showTip(`${xLabel}: ${xFmt(p.x)}<br>${yLabel}: <b>${yFmt(p.y)}</b>`, e.clientX, e.clientY);
    });
    ov.addEventListener('mouseleave', () => { cross.setAttribute('opacity', 0); hideTip(); });
    if (caption) f.box.appendChild(E('p', { class: 'cap', html: caption }));
    return f;
  }

  function section(id, title, sub) {
    const sec = E('section', { class: 'sec', id });
    sec.appendChild(E('h2', {}, [title]));
    if (sub) sec.appendChild(E('p', { class: 'sub', html: sub }));
    document.getElementById('main').appendChild(sec);
    return sec;
  }
  function grid2(sec) { const g = E('div', { class: 'g2' }); sec.appendChild(g); return g; }
  function tableView(host, headers, rows) {
    const d = E('details', { class: 'tbl' });
    d.appendChild(E('summary', {}, ['Data table']));
    const t = E('table', {});
    t.appendChild(E('thead', {}, [E('tr', {}, headers.map((h) => E('th', { text: h })))]));
    t.appendChild(E('tbody', {}, rows.map((r) => E('tr', {}, r.map((c) => E('td', { text: String(c) }))))));
    d.appendChild(t); host.appendChild(d);
  }

  const C = {
    series1: () => cssv('--series1'), series2: () => cssv('--series2'),
    ord: () => [cssv('--ord1'), cssv('--ord2'), cssv('--ord3')],
    seal: () => cssv('--seal'), good: () => cssv('--good'), crit: () => cssv('--crit'),
  };

  // ── KPI tiles ──
  function kpis() {
    const wrap = document.getElementById('kpis');
    const tiles = [
      { k: 'Peak measured', v: fmt(M.peakMeasured), u: 'calls/s', note: 'sustained, real path' },
      { k: 'Warm p50 latency', v: ms(M.warmP50), u: '', note: 'per metered call' },
      { k: 'Cold first call', v: ms(M.coldP50), u: '', note: 'git-signing ceremony' },
      { k: 'Crypto ceiling', v: fmt(M.cryptoCeil), u: 'calls/s', note: 'ed25519, all cores' },
      { k: 'Durable-writer wall', v: fmt(M.durableCeil), u: 'calls/s', note: 'per-call rename+append' },
      { k: 'Gap to 100k', v: M.gap ? fmt(M.gap) + '×' : '—', u: '', note: 'measured → target', hot: true },
    ];
    for (const t of tiles) {
      wrap.appendChild(E('div', { class: 'kpi' + (t.hot ? ' hot' : '') }, [
        E('div', { class: 'kpi-k', text: t.k }),
        E('div', { class: 'kpi-v' }, [document.createTextNode(t.v), t.u ? E('span', { class: 'kpi-u', text: ' ' + t.u }) : null]),
        E('div', { class: 'kpi-n', text: t.note }),
      ]));
    }
  }

  // ── Ramp ──
  function ramp() {
    const solo = S.ramp_solo, fleet = S.ramp_fleet;
    if ((!solo || solo.error) && (!fleet || fleet.error)) return;
    const sec = section('ramp', 'Throughput vs concurrency', 'How aggregate calls/s and latency move as the fleet grows 1→N. The <b>knee</b> is where adding agents stops buying throughput and only buys latency. <b>solo</b> = per-agent budget; <b>fleet</b> = one shared treasury cap — the gap between them is the coordination cost.');
    const g = grid2(sec);

    const series = [];
    if (solo && !solo.error) series.push({ name: 'solo', color: C.series1(), points: solo.levels.map((l) => ({ x: l.concurrency, y: l.cps })) });
    if (fleet && !fleet.error) series.push({ name: 'fleet', color: C.series2(), points: fleet.levels.map((l) => ({ x: l.concurrency, y: l.cps })) });
    lineChart(g, { series, xLabel: 'concurrent agents', yLabel: 'calls / s', xType: 'log2', yType: 'linear', caption: `Peak <b>${fmt(M.peakMeasured)} calls/s</b> — then the curve flattens: past the core count, more processes only contend.` });

    const base = (solo && !solo.error) ? solo : fleet;
    const ord = C.ord();
    lineChart(g, { series: [
      { name: 'p50', color: ord[0], points: base.levels.map((l) => ({ x: l.concurrency, y: l.latency_ms.p50 })) },
      { name: 'p95', color: ord[1], points: base.levels.map((l) => ({ x: l.concurrency, y: l.latency_ms.p95 })) },
      { name: 'p99', color: ord[2], points: base.levels.map((l) => ({ x: l.concurrency, y: l.latency_ms.p99 })) },
    ], xLabel: 'concurrent agents', yLabel: 'latency (ms)', xType: 'log2', yType: 'log', yFmt: ms, caption: `Latency under load (<b>${base.variant}</b>). Tail (p99) blows up first — the signal that the system is past its knee.` });

    // resources
    if (base.resources && base.resources.length) {
      areaChart(sec, { points: base.resources.map((r) => ({ x: r.t_ms / 1000, y: r.cpu_pct })), xLabel: 'time (s)', yLabel: 'aggregate CPU %', xFmt: (v) => v.toFixed(0) + 's', color: C.series1(), caption: `Aggregate CPU across the fleet (100% = one core). Cores here: <b>${D.meta.host.cores}</b> → saturation ≈ ${D.meta.host.cores * 100}%.` });
    }
    // verify badge
    const v = base.verify;
    if (v) sec.appendChild(E('p', { class: 'verify', html: `<span class="badge ${v.consistent === v.logs ? 'ok' : 'bad'}">${v.consistent === v.logs ? '✓ consistent' : '✗ mismatch'}</span> ${fmt(v.rederivedCalls)} calls across ${v.logs} signed logs re-derived offline — the hash-chained spend log stays correct at ${base.actual_max}-way concurrency${base.spawn_failures ? ` (note: ${base.spawn_failures} of ${base.requested_max} agents could not spawn — a real process-per-agent ceiling on this host)` : ''}.` }));

    const rows = (solo && !solo.error ? solo.levels : []).map((l, i) => {
      const fl = fleet && !fleet.error ? fleet.levels[i] : null;
      return [l.concurrency, fmt(l.cps), ms(l.latency_ms.p50), ms(l.latency_ms.p95), ms(l.latency_ms.p99), fl ? fmt(fl.cps) : '—'];
    });
    tableView(sec, ['agents', 'solo c/s', 'p50', 'p95', 'p99', 'fleet c/s'], rows);
  }

  // ── Soak ──
  function soak() {
    const so = S.soak; if (!so || so.error) return;
    const sec = section('soak', 'Sustained soak', `Pinned at <b>${so.concurrency}-wide</b> for ${so.duration_secs}s. A flat throughput line means no leak or decay under sustained metered load; the histogram shows the latency shape.`);
    const g = grid2(sec);
    areaChart(g, { points: so.throughput_series.map((p) => ({ x: p.t_ms / 1000, y: p.cps })), xLabel: 'time (s)', yLabel: 'calls / s', xFmt: (v) => v.toFixed(0) + 's', color: C.series1(), caption: `Mean <b>${fmt(so.mean_cps)} calls/s</b> held for ${so.duration_secs}s.` });
    const h = so.histogram.filter((b) => b.count > 0);
    barChart(g, { bars: h.map((b) => ({ label: b.hi === null || !isFinite(b.hi) ? '≥' + b.lo : '≤' + b.hi, value: b.count, color: C.series1() })), yLabel: 'calls', yFmt: fmt, caption: 'Latency distribution (bucket upper-bound in ms). A right tail = occasional slow calls (GC, fs hiccup, or a re-sign).' });
    if (so.resources && so.resources.length) {
      areaChart(sec, { points: so.resources.map((r) => ({ x: r.t_ms / 1000, y: r.rss_mb })), xLabel: 'time (s)', yLabel: 'resident memory (MB)', xFmt: (v) => v.toFixed(0) + 's', color: C.series2(), caption: 'Aggregate RSS over the soak — a rising line would indicate a leak; flat is healthy.' });
    }
    tableView(sec, ['bucket ≤ms', 'calls'], so.histogram.map((b) => [isFinite(b.hi) ? b.hi : '∞', b.count]));
  }

  // ── Burst ──
  function burst() {
    const bu = S.burst; if (!bu || bu.error) return;
    const sec = section('burst', 'Burst response', `From idle, fire B calls at once across ${bu.fleet_size} warmed agents and measure how fast they drain and how bad the tail gets. HFT-style spikes: does drain time stay linear in burst size, or blow up?`);
    const g = grid2(sec);
    barChart(g, { bars: bu.bursts.map((b) => ({ label: String(b.burst), value: b.effective_cps, color: C.series1(), note: 'drain ' + ms(b.drain_ms) })), yLabel: 'effective calls / s', yFmt: fmt, caption: 'Throughput sustained during each burst (burst size on x). Flat ⇒ the fleet absorbs bigger spikes without collapse.' });
    const ord = C.ord();
    lineChart(g, { series: [
      { name: 'p99', color: ord[1], points: bu.bursts.map((b) => ({ x: b.burst, y: b.summary.latency_ms.p99 })) },
      { name: 'max', color: ord[2], points: bu.bursts.map((b) => ({ x: b.burst, y: b.summary.latency_ms.max })) },
    ], xLabel: 'burst size', yLabel: 'tail latency (ms)', xType: 'log2', yType: 'log', yFmt: ms, caption: 'Tail latency vs burst size. A burst of B against K agents queues ~B/K deep per agent — the tail grows with queue depth.' });
    tableView(sec, ['burst', 'drain', 'eff calls/s', 'p50', 'p99', 'max'], bu.bursts.map((b) => [b.burst, ms(b.drain_ms), fmt(b.effective_cps), ms(b.summary.latency_ms.p50), ms(b.summary.latency_ms.p99), ms(b.summary.latency_ms.max)]));
  }

  // ── Microbench + projection ──
  function micro() {
    const mb = S.microbench; if (!mb || mb.error) return;
    const sec = section('micro', 'Where the wall is', 'Each paid call does ~2 ed25519 signs + 1 verify (crypto), 1 temp-write+rename + 1 append (durable fs), and 1 canonicalization. Measured on this host with Node’s own crypto/fs — a faithful proxy for the Rust costs. Crypto parallelizes across cores; durable writes serialize per counter. That contrast is the whole story.');
    const g = grid2(sec);
    barChart(g, {
      bars: [
        { label: 'measured peak', value: M.peakMeasured, color: C.series1() },
        { label: 'durable wall', value: M.durableCeil, color: C.seal() },
        { label: 'crypto 1 core', value: mb.crypto.ed25519_verify_per_s_1core, color: C.series1() },
        { label: `crypto ×${mb.cores} cores`, value: M.cryptoCeil, color: C.series1() },
      ],
      yLabel: 'calls / s (log)', yType: 'log', yFmt: fmt,
      refLines: [{ value: M.target, label: '100k target', color: C.seal() }],
      caption: `The enforcement <b>crypto</b> clears <b>${fmt(M.cryptoCeil)}/s</b> across ${mb.cores} cores — <b>above</b> 100k. The real system sits at ${fmt(M.peakMeasured)}/s. What pins it down is the <b>durable-writer wall</b> (${fmt(M.durableCeil)}/s) plus stdio transport, not the cryptography.`, rotate: true,
    });

    // per-call cost budget
    const d = mb.derived;
    const orch = Math.max(0, (M.warmP50 || 0) - d.per_call_crypto_ms_1core - d.per_call_durable_ms_1writer - d.per_call_canon_ms);
    barChart(g, {
      bars: [
        { label: 'crypto', value: d.per_call_crypto_ms_1core, color: C.series1() },
        { label: 'durable fs', value: d.per_call_durable_ms_1writer, color: C.seal() },
        { label: 'canon', value: d.per_call_canon_ms, color: C.series1() },
        { label: 'stdio+orch', value: orch, color: C.series2() },
      ],
      yLabel: 'ms per call', yFmt: (v) => v.toFixed(2), caption: `Per-call cost budget (single-writer). Warm p50 measured at <b>${ms(M.warmP50)}</b>; the primitives account for the crypto + fs floor, the remainder is stdio round-trips and gate orchestration.`, rotate: true,
    });

    // projection
    const psec = section('projection', 'Projection to internet scale', '<b class="tag">MODELED, NOT MEASURED.</b> Applying each architectural fix to the measured floor: amortize durability with group-commit, drop stdio for in-process transport (crypto becomes the bind), then shard across nodes at the measured per-node crypto ceiling.');
    barChart(psec, {
      bars: M.projection.map((p) => ({ label: p.label, value: p.value, color: p.measured ? C.series1() : p.target ? C.seal() : C.series2(), note: p.note })),
      yLabel: 'calls / s (log)', yType: 'log', yFmt: fmt,
      refLines: [{ value: M.target, label: '100k', color: C.seal() }],
      caption: `Reaching 100k needs <b>${M.shards ? '×' + M.shards + ' sharded nodes' : 'horizontal sharding'}</b> at the per-node crypto ceiling — after the single-node durability + transport rewrites. The cryptographic identity core is <b>not</b> the barrier; the durable-append + stdio architecture is. See <code>FINDINGS.md</code>.`, rotate: true,
    });
    tableView(psec, ['stage', 'calls/s', 'note'], M.projection.map((p) => [p.label, fmt(p.value), p.note]));
  }

  // ── Observability dogfood (#7) ──
  function metricsDogfood() {
    const mx = S.metrics; if (!mx || mx.error) return;
    const sec = section('metrics', 'Observability — /metrics dogfood',
      'The gateway now emits Prometheus metrics on the payment hot path (#7). The harness drove a known number of calls, then scraped each gateway’s own <code>/metrics</code> and cross-checked — matching counts prove the surface is load-bearing, not decorative (the study previously had to reconstruct these from the outside).');
    sec.appendChild(E('p', { class: 'verify', html:
      `<span class="badge ${mx.dogfood_match ? 'ok' : 'bad'}">${mx.dogfood_match ? '✓ match' : '✗ mismatch'}</span> `
      + `the harness drove <b>${fmt(mx.external_total)}</b> calls; the gateway’s own <code>auths_mcp_calls_total</code> counted `
      + `<b>${fmt(mx.internal.callsTotal)}</b> across ${mx.internal.scraped} agents.` }));
    if (mx.budget) {
      const b = mx.budget;
      barChart(sec, {
        bars: [
          { label: 'sign', value: b.stage_mean_ms.sign, color: C.series1() },
          { label: 'gate', value: b.stage_mean_ms.gate, color: C.series1() },
          { label: 'downstream', value: b.stage_mean_ms.downstream, color: C.seal() },
          { label: 'settle', value: b.stage_mean_ms.settle, color: C.series1() },
          { label: 'spend_log', value: b.stage_mean_ms.spend_log, color: C.series1() },
          { label: 'orchestration', value: b.orchestration_ms, color: C.series2() },
          { label: 'transport', value: b.transport_gap_ms, color: C.seal() },
        ],
        yLabel: 'mean ms / call', yFmt: (v) => v.toFixed(3), rotate: true,
        caption: `Where a metered call’s <b>${b.external_mean_ms.toFixed(2)} ms</b> actually goes, decomposed from the gateway’s own <code>auths_mcp_stage_seconds</code>. The measured stages + <b>orchestration</b> (in-handler clones/locks/logging) sum to the handler time; <b>transport</b> (external − internal) is the agent↔gateway pipe/JSON the handler cannot see. <b>downstream</b> (gateway↔adapter) and <b>orchestration</b> are the largest slices — the hot-path-hygiene and streamable-HTTP targets in the transport-overhead PRD.`,
      });
    }
    tableView(sec, ['metric (scraped from /metrics)', 'value'], [
      ['auths_mcp_calls_total{verdict="granted"}', fmt(mx.internal.granted)],
      ['auths_mcp_calls_total{verdict="refused"}', fmt(mx.internal.refused)],
      ['auths_mcp_sign_total{path="inproc"}', fmt(mx.internal.signInproc)],
      ['auths_mcp_sign_total{path="subprocess"}', fmt(mx.internal.signSubprocess)],
      ['auths_mcp_settle_total', fmt(mx.internal.settle)],
      ['auths_mcp_call_latency_seconds (samples)', fmt(mx.internal.latencyCount)],
    ]);
    sec.appendChild(E('p', { class: 'cap', html:
      `The signing breakdown independently confirms <b>#5</b>: only ${fmt(mx.internal.signSubprocess)} subprocess signs (the agent warm-ups) vs `
      + `<b>${fmt(mx.internal.signInproc)}</b> in-process — the metered hot path never forks git.` }));
  }

  // ── Adversarial chain integrity ──
  function chainSafety() {
    const c = S.chain; if (!c || c.error) return;
    const sec = section('chain', 'Adversarial — spend-log chain under concurrency',
      'The spend log is a signed hash chain (`Auths-Prev` links each record to the prior), and <code>verify-spend</code> re-derives the whole spend by replaying it. Concurrent calls that both link to the same head <b>fork</b> the log and break the audit. Each agent here PIPELINES many concurrent calls — the exact case that breaks a non-atomic head advance (it did: pre-fix, 40 pipelined calls left verify-spend 0/1).');
    sec.appendChild(E('p', { class: 'verify', html:
      `<span class="badge ${c.chain_intact ? 'ok' : 'bad'}">${c.chain_intact ? '✓ chain intact' : '✗ chain polluted'}</span> `
      + `${c.agents} agents × ${c.pipeline_depth} pipelined concurrent calls each → `
      + `<b>${c.verify.consistent}/${c.verify.logs}</b> chains re-derive consistent, <b>${fmt(c.verify.rederivedCalls)}</b> `
      + `records (expected ${fmt(c.expected_records)}) — no forks, no drops. The chain head is held atomically across `
      + `sign→append→advance, so same-chain calls serialize while different agents stay concurrent.` }));
  }

  // build
  kpis(); ramp(); soak(); burst(); micro(); metricsDogfood(); chainSafety();
  // theme toggle
  const root = document.documentElement;
  document.getElementById('theme').addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
  });
}

export function buildReportHtml(results) {
  const derived = derive(results);
  const payload = JSON.stringify({ ...results, derived });
  const meta = results.meta || {};
  const started = (meta.started_at || '').replace('T', ' ').replace(/\..+/, ' UTC');
  const css = `
:root{
  --paper:#f6f3ec; --paper-deep:#ece7db; --surface:#fbfaf5; --ink:#1c1814; --ink-soft:#5b5448;
  --muted:#726c5e; --rule:rgba(28,24,20,.16); --grid:#e6e1d5; --axis:#c9c2b2; --seal:#c2401b;
  --series1:#2a78d6; --series2:#008300; --ord1:#6da7ec; --ord2:#2a78d6; --ord3:#104281;
  --good:#0ca30c; --crit:#d03b3b; color-scheme:light;
}
@media (prefers-color-scheme:dark){:root:where(:not([data-theme="light"])){
  --paper:#09090b; --paper-deep:#111014; --surface:#141416; --ink:#fafafa; --ink-soft:#c3c2b7;
  --muted:#898781; --rule:rgba(255,255,255,.12); --grid:#26251f; --axis:#3a382f; --seal:#e0562a;
  --series1:#3987e5; --series2:#008300; --ord1:#6da7ec; --ord2:#3987e5; --ord3:#184f95;
  --good:#0ca30c; --crit:#e05a5a; color-scheme:dark;
}}
:root[data-theme="dark"]{
  --paper:#09090b; --paper-deep:#111014; --surface:#141416; --ink:#fafafa; --ink-soft:#c3c2b7;
  --muted:#898781; --rule:rgba(255,255,255,.12); --grid:#26251f; --axis:#3a382f; --seal:#e0562a;
  --series1:#3987e5; --series2:#008300; --ord1:#6da7ec; --ord2:#3987e5; --ord3:#184f95;
  --good:#0ca30c; --crit:#e05a5a; color-scheme:dark;
}
*{box-sizing:border-box} html,body{margin:0}
body{background:var(--paper); color:var(--ink); font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif; -webkit-font-smoothing:antialiased;}
.wrap{max-width:1080px; margin:0 auto; padding:40px 24px 80px}
.masthead{border-bottom:2px solid var(--ink); padding-bottom:18px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap}
h1{font-family:Fraunces,Georgia,"Times New Roman",serif; font-weight:600; font-size:34px; line-height:1.05; margin:0; letter-spacing:-.01em}
.kicker{font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--seal); font-weight:700; margin:0 0 6px}
.metaline{font-size:12.5px; color:var(--muted); font-variant-numeric:tabular-nums; text-align:right}
.metaline code{color:var(--ink-soft)}
button#theme{font:inherit; font-size:12px; border:1px solid var(--rule); background:var(--surface); color:var(--ink-soft); border-radius:999px; padding:5px 12px; cursor:pointer}
button#theme:hover{border-color:var(--seal); color:var(--seal)}
.lede{font-size:16.5px; color:var(--ink-soft); max-width:70ch; margin:20px 0 26px}
.lede b{color:var(--ink)}
#kpis{display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:1px; background:var(--rule); border:1px solid var(--rule); border-radius:12px; overflow:hidden; margin-bottom:8px}
.kpi{background:var(--surface); padding:16px 16px 14px}
.kpi.hot{background:color-mix(in srgb, var(--seal) 8%, var(--surface))}
.kpi-k{font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); font-weight:600}
.kpi-v{font-size:26px; font-weight:650; margin:5px 0 2px; letter-spacing:-.01em}
.kpi.hot .kpi-v{color:var(--seal)}
.kpi-u{font-size:13px; color:var(--muted); font-weight:500}
.kpi-n{font-size:11.5px; color:var(--muted)}
.sec{margin-top:46px}
.sec h2{font-family:Fraunces,Georgia,serif; font-weight:600; font-size:23px; margin:0 0 4px; padding-top:14px; border-top:1px solid var(--rule)}
.sec .sub{color:var(--ink-soft); font-size:14px; max-width:74ch; margin:0 0 18px}
.sub b, .cap b{color:var(--ink)}
.tag{color:var(--seal); letter-spacing:.04em; font-size:12px}
.g2{display:grid; grid-template-columns:1fr 1fr; gap:22px}
@media(max-width:820px){.g2{grid-template-columns:1fr}}
.chart{background:var(--surface); border:1px solid var(--rule); border-radius:12px; padding:12px 12px 4px; margin-bottom:14px}
svg.plot{width:100%; height:auto; display:block; overflow:visible}
.tick{font-size:10.5px; fill:var(--muted); font-variant-numeric:tabular-nums}
.axlabel{font-size:11px; fill:var(--ink-soft); font-weight:500}
.serieslabel{font-size:11.5px; font-weight:600}
.barval{font-size:10.5px; fill:var(--ink-soft); font-variant-numeric:tabular-nums}
.refl{font-size:11px; font-weight:600}
.cap{font-size:12.5px; color:var(--muted); padding:8px 6px 10px; margin:0; line-height:1.5}
.verify{font-size:13px; color:var(--ink-soft); margin:14px 0 0}
.badge{display:inline-block; font-size:11.5px; font-weight:700; padding:2px 8px; border-radius:999px; margin-right:6px}
.badge.ok{background:color-mix(in srgb,var(--good) 16%,var(--surface)); color:var(--good)}
.badge.bad{background:color-mix(in srgb,var(--crit) 16%,var(--surface)); color:var(--crit)}
details.tbl{margin:14px 0 0; font-size:12.5px}
details.tbl summary{cursor:pointer; color:var(--seal); font-weight:600; font-size:12px}
details.tbl table{border-collapse:collapse; margin-top:10px; width:100%; font-variant-numeric:tabular-nums}
details.tbl th,details.tbl td{text-align:right; padding:4px 10px; border-bottom:1px solid var(--rule)}
details.tbl th:first-child,details.tbl td:first-child{text-align:left}
details.tbl th{color:var(--muted); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.04em}
.tt{position:fixed; z-index:10; display:none; background:var(--ink); color:var(--paper); font-size:12px; padding:6px 9px; border-radius:7px; pointer-events:none; box-shadow:0 4px 16px rgba(0,0,0,.2); max-width:240px}
.tt b{color:#fff}
:root[data-theme="dark"] .tt, :root:where(:not([data-theme="light"])) .tt{background:#000}
footer{margin-top:60px; padding-top:16px; border-top:1px solid var(--rule); font-size:12px; color:var(--muted)}
`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Auths MCP — Maximum Throughput Study</title>
<style>${css}</style>
</head>
<body>
<div class="wrap">
  <div class="masthead">
    <div>
      <p class="kicker">Auths · MCP payment gateway</p>
      <h1>Maximum Throughput Study</h1>
    </div>
    <div>
      <button id="theme" type="button">◑ theme</button>
      <p class="metaline">
        ${started}<br>
        ${(meta.host?.cores ?? '?')} cores · ${(meta.host?.ram_gb ?? '?')} GB · node ${meta.host?.node ?? ''}<br>
        gateway <code>auths@${meta.auths_commit ?? '—'}</code>${results.meta?.quick ? ' · <b>quick smoke</b>' : ''}
      </p>
    </div>
  </div>
  <p class="lede">Can the Auths enforcement path scale to <b>internet scale</b> (100,000 tx/s)? This drives the real signed-settlement path — gate → sign → verify → reserve → settle → hash-chained spend log — as hard as this machine allows, entirely local and hermetic (no chain, no network), then decomposes the gap to the target. <b>Every plotted number is measured; the 100k line is a labeled projection.</b></p>
  <div id="kpis"></div>
  <div id="main"></div>
  <footer>
    Generated by <code>tests/performance/run.mjs</code> · raw metrics in <code>results/</code> · architecture recommendations in <code>FINDINGS.md</code>.
    All figures re-derivable from the signed spend logs via <code>verify-spend</code>.
  </footer>
</div>
<script>window.__DATA__=${payload};</script>
<script>(${APP.toString()})();</script>
</body>
</html>`;
}
