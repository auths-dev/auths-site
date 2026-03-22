'use client';

import { useCallback, useState } from 'react';
import { CopyCommand } from '@/components/copy-command';
import { ChallengeAuth } from '@/components/challenge-auth';
import { useAuth } from '@/lib/auth/auth-context';
import { fetchIdentity } from '@/lib/api/registry';

interface IdentityStepProps {
  onComplete: (did: string) => void;
}

export function IdentityStep({ onComplete }: IdentityStepProps) {
  const { auth, isAuthenticated } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipToAuth, setSkipToAuth] = useState(false);

  const handleVerifyIdentity = useCallback(async () => {
    if (!auth) return;
    setVerifying(true);
    setError(null);
    try {
      const identity = await fetchIdentity(auth.did);
      if (identity.status === 'active') {
        onComplete(auth.did);
      } else {
        setError('Identity found but not yet active. Make sure you ran `auths id register`.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify identity on registry');
    } finally {
      setVerifying(false);
    }
  }, [auth, onComplete]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">2. Create your identity</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Generate a keypair and register your identity on the Auths network.
        </p>
      </div>

      {!skipToAuth && (
        <>
          <CopyCommand
            command={"auths init\nauths id register"}
            label="Run these commands in your terminal:"
          />

          <p className="text-xs text-zinc-500">
            This generates an Ed25519 keypair, stores it in your platform keychain, creates a KERI inception event, and registers your DID on the network.
          </p>
        </>
      )}

      {!isAuthenticated ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              {skipToAuth ? 'Prove you own your identity:' : 'After running the commands above, prove you own the identity:'}
            </p>
            {!skipToAuth && (
              <button
                type="button"
                onClick={() => setSkipToAuth(true)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                I already have an identity
              </button>
            )}
          </div>
          <ChallengeAuth />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <p className="text-sm text-emerald-400">
              Authenticated as <code className="font-mono text-xs">{auth?.did}</code>
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleVerifyIdentity}
            disabled={verifying}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify identity on registry'}
          </button>
        </div>
      )}
    </div>
  );
}
