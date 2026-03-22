'use client';

import { useCallback, useState } from 'react';
import { CopyCommand } from '@/components/copy-command';
import { useAuth } from '@/lib/auth/auth-context';
import { fetchArtifactsBySigner } from '@/lib/api/registry';
import { REGISTRY_BASE_URL } from '@/lib/config';
import type { ArtifactEntry } from '@/lib/api/registry';

interface PublishStepProps {
  onComplete: (artifact: ArtifactEntry) => void;
}

export function PublishStep({ onComplete }: PublishStepProps) {
  const { auth } = useAuth();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckPublished = useCallback(async () => {
    if (!auth) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetchArtifactsBySigner(auth.did);
      if (res.artifacts.length > 0) {
        onComplete(res.artifacts[0]);
      } else {
        setError('No published artifacts found yet. Make sure you ran both commands.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check registry');
    } finally {
      setChecking(false);
    }
  }, [auth, onComplete]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">3. Sign and publish</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Sign any file and publish the attestation to the transparency log.
        </p>
      </div>

      <CopyCommand
        command={`echo "hello auths" > my-artifact.txt\nauths artifact sign my-artifact.txt\nauths artifact publish --signature my-artifact.txt.auths.json --package file:my-artifact.txt --registry ${REGISTRY_BASE_URL}`}
        label="Run these commands in your terminal:"
      />

      <p className="text-xs text-zinc-500">
        The first command creates a test file. The second signs it, creating a <code className="text-zinc-400">.auths.json</code> attestation. The third publishes it to the transparency log.
      </p>

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleCheckPublished}
        disabled={checking}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {checking ? 'Checking registry...' : 'Verify my artifact was published'}
      </button>
    </div>
  );
}
