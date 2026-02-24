'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { hashFileLocal } from '@/lib/hashing';
import { sources, verifiers, type Step, type SourceConfig } from '@/lib/verification';

// ── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'hashing' | 'awaiting_att' | 'verifying' | 'verified' | 'failed';

interface LogLine extends Step {
  id: string;
}

const LINE_COLOR: Record<Step['type'], string> = {
  info: 'text-zinc-400',
  hash: 'text-zinc-300 font-mono break-all',
  ok:   'text-emerald-400 font-semibold',
  err:  'text-red-400 font-semibold',
  dim:  'text-zinc-600',
};

let _lineId = 0;
const uid = () => `l${++_lineId}`;

// ── Component ────────────────────────────────────────────────────────────────

export function Hero() {
  const [mode, setMode]             = useState<SourceConfig['id']>('github');
  const [phase, setPhase]           = useState<Phase>('idle');
  const [lines, setLines]           = useState<LogLine[]>([]);
  const [input, setInput]           = useState('');

  // Manual-mode file state
  const [fileName, setFileName]     = useState('');
  const [fileHash, setFileHash]     = useState('');
  const [attInput, setAttInput]     = useState('');
  const [attFileName, setAttFileName] = useState('');
  const [dragActive, setDragActive]       = useState(false);
  const [attDragActive, setAttDragActive] = useState(false);

  const selectedSource = sources.find(s => s.id === mode)!;

  const addStep = (step: Step) =>
    setLines(prev => [...prev, { id: uid(), ...step }]);

  const reset = () => {
    setPhase('idle');
    setLines([]);
    setInput('');
    setFileName('');
    setFileHash('');
    setAttInput('');
    setAttFileName('');
  };

  const switchMode = (id: SourceConfig['id']) => {
    if (id === mode) return;
    reset();
    setMode(id);
  };

  // ── Verify (URL-based sources: github, npm, docker) ──────────────────────

  const handleVerify = useCallback(async () => {
    if (mode === 'manual') return;
    if (!input.trim()) return;

    setLines([]);
    setPhase('verifying');

    const verifyFn = verifiers[mode];
    const result = await verifyFn(input, addStep);
    setPhase(result.success ? 'verified' : 'failed');
  }, [mode, input]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual: artifact drop ────────────────────────────────────────────────

  const handleArtifactDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setFileName(file.name);
    setPhase('hashing');
    addStep({ type: 'info', text: `Hashing ${file.name} locally…` });
    addStep({ type: 'dim', text: 'File bytes never leave your browser.' });

    try {
      const hash = await hashFileLocal(file);
      setFileHash(hash);
      addStep({ type: 'hash', text: `sha256: ${hash}` });
      setPhase('awaiting_att');
      addStep({ type: 'dim', text: 'Now drop the .auths.json attestation file ↓' });
    } catch (err) {
      addStep({ type: 'err', text: `Hashing failed: ${err instanceof Error ? err.message : String(err)}` });
      setPhase('failed');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual: attestation file drop ────────────────────────────────────────

  const handleAttDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setAttDragActive(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      JSON.parse(text);
      setAttInput(text);
      setAttFileName(file.name);
    } catch {
      // Not valid JSON — ignore
    }
  }, []);

  // ── Manual: verify ───────────────────────────────────────────────────────

  const handleManualVerify = useCallback(async () => {
    if (!fileHash || !attInput.trim()) return;

    setPhase('verifying');
    const verifyFn = verifiers.manual;
    const result = await verifyFn(attInput, addStep, { fileHash });
    setPhase(result.success ? 'verified' : 'failed');
  }, [fileHash, attInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Command prompt text ──────────────────────────────────────────────────

  const commandText = mode === 'manual'
    ? `${selectedSource.commandPrefix} ${fileName || 'artifact.tar.gz'} --sig ${attFileName || 'artifact.auths.json'}`
    : `${selectedSource.commandPrefix} ${input || selectedSource.placeholder}`;

  // ── Terminal border ──────────────────────────────────────────────────────

  const borderCls =
    phase === 'verified'
      ? 'border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.12)]'
      : phase === 'failed'
        ? 'border-red-500/40'
        : dragActive
          ? 'border-zinc-400'
          : 'border-[var(--border)]';

  return (
    <div className="w-full">

      {/* ── Terminal block ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="w-full"
      >
        <motion.div
          layout
          className={`overflow-hidden rounded-xl border bg-[var(--muted-bg)] transition-[border-color,box-shadow] duration-500 ${borderCls}`}
        >
          {/* ── Source tabs (window chrome row) ─────────────────────────────── */}
          <div className="flex items-center border-b border-[var(--border)]">
            <div className="flex items-center gap-2 px-4 py-3">
              <motion.span
                animate={{ backgroundColor: phase === 'verified' ? '#10b981' : phase === 'failed' ? '#f87171' : '#52525b' }}
                transition={{ duration: 0.4 }}
                className="h-3 w-3 rounded-full"
              />
              <span className="h-3 w-3 rounded-full bg-zinc-600" />
              <span className="h-3 w-3 rounded-full bg-zinc-600" />
            </div>

            <div className="ml-2 flex items-center gap-1">
              {sources.map(source => (
                <button
                  key={source.id}
                  onClick={() => switchMode(source.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-xs transition-colors ${
                    mode === source.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5"
                    dangerouslySetInnerHTML={{ __html: source.icon }}
                  />
                  {source.label}
                  {!source.enabled && (
                    <span className="text-[10px] text-zinc-700">soon</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Command prompt ──────────────────────────────────────────────── */}
          <div className="px-5 pt-4 pb-2">
            <p className="font-mono text-sm text-zinc-400">
              <span className="text-[var(--muted)]">~ $</span>{' '}
              <span className="text-white">{commandText}</span>
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

          {/* ── Log lines ──────────────────────────────────────────────────── */}
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

          {/* ── URL input (github / npm / docker) ──────────────────────────── */}
          <AnimatePresence>
            {mode !== 'manual' && phase === 'idle' && (
              <motion.div
                key="url-input"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mx-5 mt-2 mb-4 space-y-3"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && selectedSource.enabled) handleVerify(); }}
                    placeholder={selectedSource.placeholder}
                    disabled={!selectedSource.enabled}
                    className="flex-1 rounded-lg border border-zinc-700 bg-transparent px-3 py-2 font-mono text-sm text-zinc-300 placeholder-zinc-700 outline-none transition-colors focus:border-zinc-500 disabled:opacity-40"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    onClick={handleVerify}
                    disabled={!input.trim() || !selectedSource.enabled}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-sm text-white transition-colors hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {selectedSource.enabled ? 'verify →' : 'coming soon'}
                  </button>
                </div>

                <button
                  onClick={() => switchMode('manual')}
                  className="font-mono text-xs text-zinc-700 underline underline-offset-2 transition-colors hover:text-zinc-400"
                >
                  or verify manually with file drop
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Manual file-drop UI ────────────────────────────────────────── */}
          <AnimatePresence>
            {mode === 'manual' && ['idle', 'hashing', 'awaiting_att'].includes(phase) && (
              <motion.div
                key="manual-form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mx-5 mt-2 mb-4 space-y-3"
              >
                {/* 1. Artifact dropzone */}
                <div
                  className={`flex min-h-[60px] cursor-default flex-col items-center justify-center rounded-lg border border-dashed px-4 py-3 text-center text-sm transition-colors duration-200 ${
                    dragActive
                      ? 'border-zinc-400 bg-zinc-800/30 text-zinc-300'
                      : fileHash
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-zinc-700 text-zinc-500'
                  }`}
                  onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleArtifactDrop}
                >
                  {phase === 'hashing' ? (
                    <div className="flex items-center gap-3 font-mono text-sm text-zinc-400">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
                      Computing SHA-256…
                    </div>
                  ) : fileHash ? (
                    <div className="font-mono text-xs text-emerald-400">
                      ✓ {fileName} hashed locally
                    </div>
                  ) : (
                    '1. Drop an artifact here to hash locally'
                  )}
                </div>

                {/* 2. Attestation file input */}
                <div
                  className={`rounded-lg border transition-colors duration-150 ${
                    attDragActive
                      ? 'border-zinc-400 bg-zinc-800/30'
                      : attFileName
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-zinc-700'
                  }`}
                  onDragOver={e => { e.preventDefault(); setAttDragActive(true); }}
                  onDragLeave={() => setAttDragActive(false)}
                  onDrop={handleAttDrop}
                >
                  <label className="block px-3 pt-2 font-mono text-xs text-zinc-600">
                    2. attestation (.auths.json) — drop file or paste contents
                  </label>
                  {attFileName ? (
                    <div className="flex items-center gap-2 px-3 pb-2 pt-1">
                      <span className="font-mono text-xs text-emerald-400">✓ {attFileName}</span>
                      <button
                        onClick={() => { setAttInput(''); setAttFileName(''); }}
                        className="font-mono text-xs text-zinc-700 hover:text-zinc-400"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <textarea
                      rows={2}
                      value={attInput}
                      onChange={e => { setAttInput(e.target.value); setAttFileName(''); }}
                      placeholder='Drop .auths.json here, or paste {"version":1,"rid":"sha256:…'
                      className="w-full resize-none bg-transparent px-3 pb-2 font-mono text-xs text-zinc-300 placeholder-zinc-700 outline-none"
                      spellCheck={false}
                      autoComplete="off"
                    />
                  )}
                </div>

                <button
                  onClick={handleManualVerify}
                  disabled={!fileHash || !attInput.trim() || phase === 'hashing'}
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
        </motion.div>
      </motion.div>

    </div>
  );
}
