'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { hashFileLocal } from '@/lib/hashing';
import { verifyArtifact } from '@/lib/wasm-bridge';
import { didKeyToPublicKeyHex } from '@/lib/resolver';
import { AuthsVerifyWidget } from './auths-verify-widget';

// ── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | 'idle'
  | 'hashing'
  | 'awaiting_inputs'
  | 'verifying'
  | 'verified'
  | 'failed';

interface LogLine {
  id: string;
  type: 'info' | 'hash' | 'ok' | 'err' | 'dim';
  text: string;
}

const LINE_COLOR: Record<LogLine['type'], string> = {
  info: 'text-zinc-400',
  hash: 'text-zinc-300 font-mono break-all',
  ok:   'text-emerald-400 font-semibold',
  err:  'text-red-400 font-semibold',
  dim:  'text-zinc-600',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Read a .sig file as a hex string.  Handles both binary and text-hex formats. */
async function readSigAsHex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // If the file is small and already looks like hex text, use it directly.
  if (bytes.length <= 512) {
    const text = new TextDecoder().decode(bytes).trim();
    if (/^[0-9a-fA-F]+$/.test(text)) return text.toLowerCase();
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Resolve a did:key:z… or raw 64-char hex string to an Ed25519 public key hex. */
function toPublicKeyHex(input: string): string {
  const s = input.trim();
  if (s.startsWith('did:key:z')) return didKeyToPublicKeyHex(s);
  if (/^[0-9a-fA-F]{64}$/.test(s)) return s.toLowerCase();
  throw new Error('Expected did:key:z… or 64-char hex public key');
}

/** Truncate a long hex string for terminal display. */
function clip(hex: string, n = 14): string {
  return hex.length > n * 2 ? `${hex.slice(0, n)}…${hex.slice(-(n / 2))}` : hex;
}

let _lineId = 0;
const uid = () => `l${++_lineId}`;

// ── Component ────────────────────────────────────────────────────────────────

export function Hero() {
  const [phase, setPhase]         = useState<Phase>('idle');
  const [lines, setLines]         = useState<LogLine[]>([]);
  const [fileName, setFileName]   = useState('');
  const [fileHash, setFileHash]   = useState('');
  const [sigInput, setSigInput]   = useState('');
  const [didInput, setDidInput]   = useState('');
  const [dragActive, setDragActive]       = useState(false);
  const [sigDragActive, setSigDragActive] = useState(false);

  const add = (type: LogLine['type'], text: string) =>
    setLines(prev => [...prev, { id: uid(), type, text }]);

  const reset = () => {
    setPhase('idle');
    setLines([]);
    setFileName('');
    setFileHash('');
    setSigInput('');
    setDidInput('');
  };

  // ── Artifact drop ──────────────────────────────────────────────────────────

  const handleArtifactDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;

      setFileName(file.name);
      setPhase('hashing');
      add('info', `Hashing ${file.name} locally…`);
      add('dim',  'File bytes never leave your browser.');

      try {
        const hash = await hashFileLocal(file);
        setFileHash(hash);
        add('hash', `sha256: ${hash}`);
        setPhase('awaiting_inputs');
        add('dim', 'Provide the detached signature and signer identity ↓');
      } catch (err) {
        add('err', `Hashing failed: ${err instanceof Error ? err.message : String(err)}`);
        setPhase('failed');
      }
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Signature file sub-drop ────────────────────────────────────────────────

  const handleSigDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setSigDragActive(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      const hex = await readSigAsHex(file);
      setSigInput(hex);
    } catch {
      // User can still paste hex manually
    }
  }, []);

  // ── Verify ─────────────────────────────────────────────────────────────────

  const handleVerify = useCallback(async () => {
    if (!sigInput.trim() || !didInput.trim()) return;

    setPhase('verifying');
    add('info', `sig:      ${clip(sigInput.trim())}`);
    add('info', `identity: ${didInput.trim()}`);
    add('info', 'Calling WASM Ed25519 verifier…');

    try {
      const pkHex = toPublicKeyHex(didInput);
      const valid = await verifyArtifact(fileHash, sigInput.trim(), pkHex);
      if (valid) {
        add('ok',  '✓  SIGNATURE VERIFIED');
        add('dim', 'Cryptographic proof established. No server involved.');
        setPhase('verified');
      } else {
        add('err', '✗  VERIFICATION FAILED');
        add('err', 'Signature does not match this artifact.');
        setPhase('failed');
      }
    } catch (err) {
      add('err', `Error: ${err instanceof Error ? err.message : String(err)}`);
      setPhase('failed');
    }
  },
  [fileHash, sigInput, didInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Terminal border ────────────────────────────────────────────────────────

  const borderCls =
    phase === 'verified'
      ? 'border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.12)]'
      : phase === 'failed'
        ? 'border-red-500/40'
        : dragActive
          ? 'border-zinc-400'
          : 'border-[var(--border)]';

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20">

      {/* ── Headline ──────────────────────────────────────────────────────── */}
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Cryptographic Trust,{' '}
          <span className="text-[var(--accent-verified)]">Decentralized.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="mx-auto mt-5 max-w-xl text-base text-[var(--muted)] sm:text-lg"
        >
          Verify software supply chains instantly, without relying on centralized
          identity providers.
        </motion.p>
      </div>

      {/* ── Terminal block ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="mt-12 w-full max-w-2xl"
      >
        <motion.div
          layout
          className={`overflow-hidden rounded-xl border bg-[var(--muted-bg)] transition-[border-color,box-shadow] duration-500 ${borderCls}`}
          /* Artifact drop handlers active only in idle phase */
          onDragOver={phase === 'idle' ? e => { e.preventDefault(); setDragActive(true); } : undefined}
          onDragLeave={phase === 'idle' ? () => setDragActive(false) : undefined}
          onDrop={phase === 'idle' ? handleArtifactDrop : undefined}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
            <motion.span
              animate={{ backgroundColor: phase === 'verified' ? '#10b981' : phase === 'failed' ? '#f87171' : '#52525b' }}
              transition={{ duration: 0.4 }}
              className="h-3 w-3 rounded-full"
            />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
          </div>

          {/* Command prompt */}
          <div className="px-5 pt-4 pb-2">
            <p className="font-mono text-sm text-zinc-400">
              <span className="text-[var(--muted)]">~ $</span>{' '}
              <span className="text-white">
                auths verify {fileName || 'artifact.tar.gz'} --signature artifact.sig
              </span>
              <AnimatePresence>
                {phase === 'verified' && (
                  <motion.span
                    key="ok-tick"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-2 text-emerald-400"
                  >
                    ✓
                  </motion.span>
                )}
                {phase === 'failed' && (
                  <motion.span
                    key="err-cross"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-2 text-red-400"
                  >
                    ✗
                  </motion.span>
                )}
              </AnimatePresence>
            </p>
          </div>

          {/* Log lines */}
          <div className="px-5 space-y-1 pb-1 min-h-0">
            <AnimatePresence>
              {lines.map((line, i) => (
                <motion.p
                  key={line.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.035 }}
                  className={`text-sm leading-relaxed ${LINE_COLOR[line.type]}`}
                >
                  <span className="font-mono">
                    <span className="select-none text-zinc-700">{'>'} </span>
                    {line.text}
                  </span>
                </motion.p>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Drop zone (idle only) ──────────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'idle' && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`mx-5 mt-2 mb-4 flex min-h-[80px] cursor-default items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center text-sm transition-colors duration-200 ${dragActive ? 'border-zinc-400 bg-zinc-800/30 text-zinc-300' : 'border-zinc-700 text-zinc-500'}`}
              >
                Drop an artifact here to verify instantly via WebAssembly
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Hashing spinner ───────────────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'hashing' && (
              <motion.div
                key="hashing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-5 mt-1 mb-4 flex items-center gap-3 font-mono text-sm text-zinc-600"
              >
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
                Computing SHA-256…
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Input form (awaiting_inputs) ──────────────────────────────── */}
          <AnimatePresence>
            {phase === 'awaiting_inputs' && (
              <motion.div
                key="inputs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mx-5 mt-2 mb-4 space-y-3"
              >
                {/* Signature input */}
                <div
                  className={`rounded-lg border transition-colors duration-150 ${sigDragActive ? 'border-zinc-400 bg-zinc-800/30' : 'border-zinc-700'}`}
                  onDragOver={e => { e.preventDefault(); setSigDragActive(true); }}
                  onDragLeave={() => setSigDragActive(false)}
                  onDrop={handleSigDrop}
                >
                  <label className="block px-3 pt-2 font-mono text-xs text-zinc-600">
                    signature hex or .sig file
                  </label>
                  <textarea
                    rows={2}
                    value={sigInput}
                    onChange={e => setSigInput(e.target.value)}
                    placeholder="Paste hex or drop .sig file here…"
                    className="w-full resize-none bg-transparent px-3 pb-2 font-mono text-xs text-zinc-300 placeholder-zinc-700 outline-none"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>

                {/* DID / pubkey input */}
                <div className="rounded-lg border border-zinc-700">
                  <label className="block px-3 pt-2 font-mono text-xs text-zinc-600">
                    signer — did:key:z… or 64-char hex pubkey
                  </label>
                  <input
                    type="text"
                    value={didInput}
                    onChange={e => setDidInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                    placeholder="did:key:z6Mk…"
                    className="w-full bg-transparent px-3 pb-2 font-mono text-xs text-zinc-300 placeholder-zinc-700 outline-none"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={!sigInput.trim() || !didInput.trim()}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 font-mono text-sm text-white transition-colors hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  verify via WASM →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Verifying spinner ─────────────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'verifying' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-5 mt-1 mb-4 flex items-center gap-3 font-mono text-sm text-zinc-600"
              >
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
                Running Ed25519 in WASM…
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Reset link ────────────────────────────────────────────────── */}
          <AnimatePresence>
            {(phase === 'verified' || phase === 'failed') && (
              <motion.div
                key="reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mx-5 mb-4"
              >
                <button
                  onClick={reset}
                  className="font-mono text-xs text-zinc-700 underline underline-offset-2 transition-colors hover:text-zinc-400"
                >
                  verify another artifact
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Live repo attestation widget ──────────────────────────────── */}
          <div className="border-t border-[var(--border)] px-5 py-4">
            <AuthsVerifyWidget
              repo="https://github.com/auths-dev/auths"
              mode="detail"
              size="lg"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* ── Trust logos placeholder ────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-12 text-sm text-zinc-600"
      >
        Trusted by{' '}
        <span className="mx-2 inline-block h-5 w-16 rounded bg-zinc-800" />{' '}
        <span className="mx-2 inline-block h-5 w-16 rounded bg-zinc-800" />{' '}
        <span className="mx-2 inline-block h-5 w-16 rounded bg-zinc-800" />{' '}
        — entirely mathematically.
      </motion.p>
    </section>
  );
}
