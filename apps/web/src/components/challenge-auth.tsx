'use client';

import { useState, useCallback } from 'react';
import { createChallenge, verifyChallenge } from '@/lib/api/registry';
import { useAuth } from '@/lib/auth/auth-context';

type ChallengeState =
  | { step: 'idle' }
  | { step: 'loading' }
  | { step: 'awaiting-signature'; sessionId: string; nonce: string; domain: string; expiresAt: string }
  | { step: 'verifying' }
  | { step: 'error'; message: string; sessionId?: string; nonce?: string; domain?: string; expiresAt?: string };

interface ChallengeAuthProps {
  onSuccess?: () => void;
}

export function ChallengeAuth({ onSuccess }: ChallengeAuthProps) {
  const { setAuth } = useAuth();
  const [state, setState] = useState<ChallengeState>({ step: 'idle' });
  const [cliOutput, setCliOutput] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const handleGenerateChallenge = useCallback(async () => {
    setState({ step: 'loading' });
    try {
      const res = await createChallenge();
      setState({
        step: 'awaiting-signature',
        sessionId: res.id,
        nonce: res.nonce,
        domain: res.domain,
        expiresAt: res.expires_at,
      });
    } catch (err) {
      setState({ step: 'error', message: err instanceof Error ? err.message : 'Failed to generate challenge' });
    }
  }, []);

  const handleVerify = useCallback(async () => {
    const sessionId =
      state.step === 'awaiting-signature' ? state.sessionId :
      state.step === 'error' ? state.sessionId :
      undefined;
    if (!sessionId || !cliOutput.trim()) return;

    setState({ step: 'verifying' });
    try {
      const parsed = JSON.parse(cliOutput.trim());
      const data = parsed.data ?? parsed;

      if (!data.signature || !data.public_key || !data.did) {
        throw new Error('JSON must contain signature, public_key, and did fields');
      }

      const res = await verifyChallenge(sessionId, {
        signature: data.signature,
        public_key: data.public_key,
        did: data.did,
      });
      setAuth({ token: res.token, did: res.did, expiresAt: res.expires_at });
      onSuccess?.();
    } catch (err) {
      const nonce = state.step === 'awaiting-signature' ? state.nonce : (state.step === 'error' ? state.nonce : undefined);
      const domain = state.step === 'awaiting-signature' ? state.domain : (state.step === 'error' ? state.domain : undefined);
      const expiresAt = state.step === 'awaiting-signature' ? state.expiresAt : (state.step === 'error' ? state.expiresAt : undefined);
      setState({
        step: 'error',
        message: err instanceof Error ? err.message : 'Verification failed',
        sessionId,
        nonce,
        domain,
        expiresAt,
      });
    }
  }, [state, cliOutput, setAuth, onSuccess]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch { /* ignore */ }
  }, []);

  if (state.step === 'idle') {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">
          Prove your Auths identity
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          Authenticate by signing a challenge with your Auths CLI.
        </p>
        <button
          type="button"
          onClick={handleGenerateChallenge}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          Generate challenge
        </button>
      </div>
    );
  }

  if (state.step === 'loading' || state.step === 'verifying') {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-800" />
      </div>
    );
  }

  const nonce = state.step === 'awaiting-signature' ? state.nonce : (state.step === 'error' ? state.nonce : undefined);
  const domain = state.step === 'awaiting-signature' ? state.domain : (state.step === 'error' ? state.domain : 'auths.dev');
  const command = nonce ? `auths auth challenge --nonce ${nonce} --domain ${domain ?? 'auths.dev'} --json` : undefined;
  const nonceExpired =
    state.step === 'awaiting-signature' && new Date(state.expiresAt) < new Date();

  // Error without a nonce means the initial challenge fetch failed — show retry
  if (state.step === 'error' && !nonce) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-zinc-100">
          Prove your Auths identity
        </h3>
        <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {state.message}
        </div>
        <button
          type="button"
          onClick={handleGenerateChallenge}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-zinc-100">
        Prove your Auths identity
      </h3>

      <div aria-live="polite">
        {state.step === 'error' && (
          <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {state.message}
          </div>
        )}
      </div>

      {nonceExpired ? (
        <div className="space-y-3">
          <p className="text-sm text-yellow-400" aria-live="polite">Challenge expired.</p>
          <button
            type="button"
            onClick={handleGenerateChallenge}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
          >
            Generate new challenge
          </button>
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm text-zinc-400 mb-2">Run this in your terminal:</p>
            <div className="relative">
              <pre className="rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3 font-mono text-sm text-emerald-400 overflow-x-auto">
                $ {command}
              </pre>
              <button
                type="button"
                onClick={() => command && handleCopy(command)}
                className="absolute top-2 right-2 rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900"
              >
                {copyState === 'copied' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="challenge-cli-output" className="block text-sm text-zinc-400 mb-1">
              Paste the JSON output:
            </label>
            <textarea
              id="challenge-cli-output"
              value={cliOutput}
              onChange={(e) => setCliOutput(e.target.value)}
              placeholder='{"signature":"...","public_key":"...","did":"did:keri:E..."}'
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 font-mono text-sm focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y"
            />
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={!cliOutput.trim()}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify
          </button>
        </>
      )}
    </div>
  );
}
