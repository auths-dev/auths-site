'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileJson } from 'lucide-react';
import { verifyPresentation, verifyEvidencePack } from '@/lib/verify/bridge';
import { VerdictChip, type VerdictTone } from '@/components/verdict-chip';

type Kind = 'presentation' | 'evidence-pack' | 'unknown';

interface Outcome {
  filename: string;
  kind: Kind;
  headline: { tone: VerdictTone; label: string };
  verdict: unknown;
}

function detectKind(obj: unknown): Kind {
  if (obj && typeof obj === 'object') {
    const o = obj as Record<string, unknown>;
    if ('envelope' in o && 'credential' in o) return 'presentation';
    if ('rows' in o && ('framework' in o || 'schema_version' in o)) return 'evidence-pack';
  }
  return 'unknown';
}

function presentationHeadline(v: unknown): { tone: VerdictTone; label: string } {
  const kind = (v as { kind?: string })?.kind ?? 'unknown';
  if (kind === 'valid') return { tone: 'ok', label: 'valid presentation' };
  if (kind === 'malformedRequest' || kind === 'unsupportedSchemaVersion' || kind === 'inputTooLarge')
    return { tone: 'warn', label: kind };
  return { tone: 'deny', label: kind };
}

function evidenceHeadline(v: unknown): { tone: VerdictTone; label: string } {
  const o = v as { kind?: string; rows?: Array<{ authority_consistent?: boolean }> };
  if (o?.kind === 'error') return { tone: 'deny', label: 'pack error' };
  if (o?.kind === 'verdicts') {
    const rows = o.rows ?? [];
    const allConsistent = rows.length > 0 && rows.every((r) => r.authority_consistent);
    return allConsistent
      ? { tone: 'ok', label: `${rows.length} rows, authority consistent` }
      : { tone: 'warn', label: `${rows.length} rows, review authority` };
  }
  return { tone: 'neutral', label: 'verified' };
}

/**
 * The evidence drop-zone (plan X2.4) — the purest demo of the thesis. Drop a
 * presentation request or an evidence pack and the WASM verifier checks it
 * entirely in this browser. The file is read with the FileReader API and never
 * leaves the machine — there is no upload endpoint.
 */
export function EvidenceDropzone() {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setOutcome(null);
    setBusy(true);
    try {
      const text = await file.text();
      let obj: unknown;
      try {
        obj = JSON.parse(text);
      } catch {
        throw new Error('not valid JSON');
      }
      const kind = detectKind(obj);
      if (kind === 'presentation') {
        const verdict = await verifyPresentation(text);
        setOutcome({ filename: file.name, kind, headline: presentationHeadline(verdict), verdict });
      } else if (kind === 'evidence-pack') {
        const org = (obj as { org?: string }).org;
        const pinnedRoots = JSON.stringify(org ? [org] : []);
        const verdict = await verifyEvidencePack(text, pinnedRoots);
        setOutcome({ filename: file.name, kind, headline: evidenceHeadline(verdict), verdict });
      } else {
        throw new Error(
          'unrecognized bundle — expected a presentation request (envelope + credential) or an evidence pack (rows + framework)',
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-14 text-center transition-colors ${
          dragging ? 'border-seal bg-seal/5' : 'border-rule bg-paper-deep/20 hover:border-ink-faint'
        }`}
      >
        <Upload size={22} className="text-ink-faint" aria-hidden="true" />
        <p className="font-mono text-[13px] text-ink">
          {busy ? 'verifying in your browser…' : 'drop an activity.json / presentation / evidence bundle'}
        </p>
        <p className="max-w-md font-mono text-[11px] text-ink-faint">
          read locally with the FileReader API — it never leaves this machine, there is no upload
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {error ? (
        <div className="mt-6 rounded-sm border border-deny/30 bg-deny/5 p-5">
          <p className="font-mono text-[12px] text-deny">could not verify — {error}</p>
        </div>
      ) : null}

      {outcome ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-ink-soft">
              <FileJson size={13} aria-hidden="true" />
              {outcome.filename}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              {outcome.kind}
            </span>
            <VerdictChip tone={outcome.headline.tone} label={outcome.headline.label} />
          </div>
          <pre className="max-h-[28rem] overflow-auto rounded-sm bg-[#15130f] p-5 font-mono text-[12px] leading-relaxed text-stone-300">
            {JSON.stringify(outcome.verdict, null, 2)}
          </pre>
          <p className="font-mono text-[11px] text-ink-faint">
            computed by the WASM verifier in your browser · the same result{' '}
            <span className="text-ink-soft">auths verify</span> gives at a terminal
          </p>
        </div>
      ) : null}
    </div>
  );
}
