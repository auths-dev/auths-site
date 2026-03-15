# Onboarding Wizard Implementation Plan

**Goal:** Build a unified `/try` onboarding page with two flows — Individual (3 sequential steps) and Organization (3 free-form task cards) — sharing DID challenge-response authentication.

**Architecture:** Single `/try` route with a flow selector ("Individuals" / "Organizations"). Selecting one unfolds that wizard below with `motion/react` animation. Both flows share an `AuthContext` provider for ephemeral DID-based auth and a `ChallengeAuth` component. The individual flow is sequential (install → create identity → publish); the org flow is free-form cards (create org, invite members, set policy). A separate `/join/[code]` route handles org invite links.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5.7, Tailwind CSS 4, motion/react (Framer Motion 12), TanStack Query v5

**Key design docs:**
- `docs/plans/2026-03-15-org-onboarding-design.md`
- `docs/plans/2026-03-15-individual-onboarding-design.md`

**Existing patterns to follow:**
- Server component + Suspense + client component (see `apps/web/src/app/registry/page.tsx`)
- Card: `rounded-xl border border-zinc-800 bg-zinc-950/50 p-6`
- Input: `w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20`
- Button primary: `rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400`
- Button secondary: `rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800`
- Copy pattern: `useState<'idle' | 'copied' | 'fallback'>` (see `onboarding-terminal.tsx`)
- Query key factory: `registryKeys` in `lib/queries/registry.ts`
- API fetch wrapper: `registryFetch()` in `lib/api/registry.ts`
- Metadata: `constructMetadata()` from `lib/metadata.ts`

---

## Task 1: Auth API Client Functions

Add the DID challenge-response API functions that both wizards depend on.

**Files:**
- Modify: `apps/web/src/lib/api/registry.ts` (append to end)

**Step 1: Add auth and org write types to registry.ts**

Append after the `fetchOrgPolicy` function (after line 617):

```typescript
// ---------------------------------------------------------------------------
// Auth types (DID challenge-response)
// ---------------------------------------------------------------------------

export interface ChallengeResponse {
  nonce: string;
  expires_at: string;
}

export interface VerifyResponse {
  token: string;
  did: string;
  expires_at: string;
}

// ---------------------------------------------------------------------------
// Org write types
// ---------------------------------------------------------------------------

export interface CreateOrgResponse {
  org_did: string;
  name: string;
  created_at: string;
}

export interface InviteResponse {
  short_code: string;
  invite_url: string;
  expires_at: string;
}

export interface OrgStatusResponse {
  org_did: string;
  name: string;
  member_count: number;
  pending_invites: number;
  signing_policy_enabled: boolean;
}

export interface InviteDetailsResponse {
  org_name: string;
  role: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
}
```

**Step 2: Add authenticated fetch wrapper**

Append after the types from Step 1:

```typescript
// ---------------------------------------------------------------------------
// Authenticated fetch wrapper
// ---------------------------------------------------------------------------

async function registryFetchAuth<T>(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const url = new URL(path, REGISTRY_BASE_URL);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  if (options.signal) options.signal.addEventListener('abort', () => controller.abort());

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    let message = res.statusText;
    let detail: string | undefined;
    let code: string | undefined;
    let errorType: string | undefined;
    try {
      const body = await res.json();
      if (typeof body.detail === 'string') { message = body.detail; detail = body.detail; }
      else if (typeof body.error === 'string') message = body.error;
      else if (typeof body.message === 'string') message = body.message;
      if (typeof body.code === 'string') code = body.code;
      if (typeof body.type === 'string') errorType = body.type;
    } catch { /* use statusText */ }
    throw new RegistryApiError(res.status, message, detail, code, errorType);
  }

  return res.json() as Promise<T>;
}
```

**Step 3: Add auth and org API functions**

Append after the authenticated fetch wrapper:

```typescript
// ---------------------------------------------------------------------------
// Auth API (DID challenge-response)
// ---------------------------------------------------------------------------

export async function createChallenge(
  signal?: AbortSignal,
): Promise<ChallengeResponse> {
  return registryFetchAuth<ChallengeResponse>('/v1/auth/challenge', {
    method: 'POST',
    signal,
  });
}

export async function verifyChallenge(
  nonce: string,
  signature: string,
  signal?: AbortSignal,
): Promise<VerifyResponse> {
  return registryFetchAuth<VerifyResponse>('/v1/auth/verify', {
    method: 'POST',
    body: { nonce, signature },
    signal,
  });
}

// ---------------------------------------------------------------------------
// Org write API
// ---------------------------------------------------------------------------

export async function createOrg(
  name: string,
  token: string,
  signal?: AbortSignal,
): Promise<CreateOrgResponse> {
  return registryFetchAuth<CreateOrgResponse>('/v1/orgs', {
    method: 'POST',
    token,
    body: { name },
    signal,
  });
}

export async function createInvite(
  orgDid: string,
  role: string,
  expiresIn: string,
  token: string,
  signal?: AbortSignal,
): Promise<InviteResponse> {
  return registryFetchAuth<InviteResponse>(
    `/v1/orgs/${encodeURIComponent(orgDid)}/invite`,
    { method: 'POST', token, body: { role, expires_in: expiresIn }, signal },
  );
}

export async function setOrgPolicy(
  orgDid: string,
  requireSigning: boolean,
  token: string,
  signal?: AbortSignal,
): Promise<OrgPolicyResponse> {
  return registryFetchAuth<OrgPolicyResponse>(
    `/v1/orgs/${encodeURIComponent(orgDid)}/policy`,
    { method: 'PUT', token, body: { require_signing: requireSigning }, signal },
  );
}

export async function fetchOrgStatus(
  orgDid: string,
  token: string,
  signal?: AbortSignal,
): Promise<OrgStatusResponse> {
  return registryFetchAuth<OrgStatusResponse>(
    `/v1/orgs/${encodeURIComponent(orgDid)}/status`,
    { token, signal },
  );
}

export async function fetchInviteDetails(
  code: string,
  signal?: AbortSignal,
): Promise<InviteDetailsResponse> {
  return registryFetchAuth<InviteDetailsResponse>(
    `/v1/invites/${encodeURIComponent(code)}`,
    { signal },
  );
}
```

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors related to registry.ts

**Step 5: Commit**

```bash
git add apps/web/src/lib/api/registry.ts
git commit -m "feat: add auth and org write API client functions for onboarding wizard"
```

---

## Task 2: AuthContext Provider

Create the shared ephemeral auth context used by both wizard flows.

**Files:**
- Create: `apps/web/src/lib/auth/auth-context.tsx`

**Step 1: Create auth context**

```typescript
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface AuthState {
  token: string;
  did: string;
  expiresAt: string;
}

interface AuthContextValue {
  auth: AuthState | null;
  setAuth: (state: AuthState) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState | null>(null);

  const setAuth = useCallback((state: AuthState) => {
    setAuthState(state);
  }, []);

  const clearAuth = useCallback(() => {
    setAuthState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        clearAuth,
        isAuthenticated: auth !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/lib/auth/auth-context.tsx
git commit -m "feat: add AuthContext provider for ephemeral DID-based auth"
```

---

## Task 3: ChallengeAuth Component

Create the shared DID challenge-response UI component.

**Files:**
- Create: `apps/web/src/components/challenge-auth.tsx`

**Step 1: Create challenge auth component**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { createChallenge, verifyChallenge } from '@/lib/api/registry';
import { useAuth } from '@/lib/auth/auth-context';

type ChallengeState =
  | { step: 'idle' }
  | { step: 'loading' }
  | { step: 'awaiting-signature'; nonce: string; expiresAt: string }
  | { step: 'verifying' }
  | { step: 'error'; message: string; nonce?: string };

interface ChallengeAuthProps {
  onSuccess?: () => void;
}

export function ChallengeAuth({ onSuccess }: ChallengeAuthProps) {
  const { setAuth } = useAuth();
  const [state, setState] = useState<ChallengeState>({ step: 'idle' });
  const [signature, setSignature] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const handleGenerateChallenge = useCallback(async () => {
    setState({ step: 'loading' });
    try {
      const res = await createChallenge();
      setState({ step: 'awaiting-signature', nonce: res.nonce, expiresAt: res.expires_at });
    } catch (err) {
      setState({ step: 'error', message: err instanceof Error ? err.message : 'Failed to generate challenge' });
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (state.step !== 'awaiting-signature' && state.step !== 'error') return;
    const nonce = 'nonce' in state ? state.nonce : undefined;
    if (!nonce || !signature.trim()) return;

    setState({ step: 'verifying' });
    try {
      const res = await verifyChallenge(nonce, signature.trim());
      setAuth({ token: res.token, did: res.did, expiresAt: res.expires_at });
      onSuccess?.();
    } catch (err) {
      setState({
        step: 'error',
        message: err instanceof Error ? err.message : 'Verification failed',
        nonce,
      });
    }
  }, [state, signature, setAuth, onSuccess]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch { /* ignore */ }
  }, []);

  const nonceExpired =
    state.step === 'awaiting-signature' && new Date(state.expiresAt) < new Date();

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

  const nonce = state.step === 'awaiting-signature' ? state.nonce : state.nonce;
  const command = `auths auth challenge --nonce ${nonce}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-zinc-100">
        Prove your Auths identity
      </h3>

      {state.step === 'error' && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.message}
        </div>
      )}

      {nonceExpired ? (
        <div className="space-y-3">
          <p className="text-sm text-yellow-400">Challenge expired.</p>
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
                onClick={() => handleCopy(command)}
                className="absolute top-2 right-2 rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900"
              >
                {copyState === 'copied' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Paste the signature output:
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="sig:Ed25519:..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 font-mono text-sm focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={!signature.trim()}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify
          </button>
        </>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/challenge-auth.tsx
git commit -m "feat: add ChallengeAuth component for DID challenge-response auth"
```

---

## Task 4: CopyCommand Component

Extract the copy-to-clipboard terminal command pattern into a reusable component for all wizard steps.

**Files:**
- Create: `apps/web/src/components/copy-command.tsx`

**Step 1: Create component**

```typescript
'use client';

import { useState, useCallback } from 'react';

interface CopyCommandProps {
  command: string;
  label?: string;
}

export function CopyCommand({ command, label }: CopyCommandProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'fallback'>('idle');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('fallback');
      setTimeout(() => setCopyState('idle'), 4000);
    }
  }, [command]);

  return (
    <div>
      {label && <p className="text-sm text-zinc-400 mb-2">{label}</p>}
      <div className="relative">
        <pre className="rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3 font-mono text-sm text-emerald-400 overflow-x-auto">
          <code>
            {command.split('\n').map((line, i) => (
              <span key={i} className="block">
                <span className="select-none text-zinc-600">$ </span>
                <span>{line}</span>
              </span>
            ))}
          </code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900"
        >
          {copyState === 'copied' && <span className="text-emerald-400">Copied!</span>}
          {copyState === 'fallback' && <span className="text-yellow-400">Ctrl+C</span>}
          {copyState === 'idle' && 'Copy'}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/components/copy-command.tsx
git commit -m "feat: add CopyCommand reusable component"
```

---

## Task 5: Individual Flow — Install Step

**Files:**
- Create: `apps/web/src/app/try/individual/install-step.tsx`

**Step 1: Create component**

```typescript
'use client';

import { CopyCommand } from '@/components/copy-command';

interface InstallStepProps {
  onComplete: () => void;
}

export function InstallStep({ onComplete }: InstallStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">1. Install the CLI</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Install the Auths CLI to manage your cryptographic identity.
        </p>
      </div>

      <CopyCommand command="curl -fsSL https://get.auths.dev | sh" />

      <p className="text-xs text-zinc-500">
        Also available via Homebrew: <code className="text-zinc-400">brew install auths-dev/tap/auths</code>
      </p>

      <button
        type="button"
        onClick={onComplete}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
      >
        I&apos;ve installed it
      </button>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/individual/install-step.tsx
git commit -m "feat: add install step for individual onboarding"
```

---

## Task 6: Individual Flow — Identity Step

**Files:**
- Create: `apps/web/src/app/try/individual/identity-step.tsx`

**Step 1: Create component**

```typescript
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

  const handleAuthSuccess = useCallback(async () => {
    // auth context is set by ChallengeAuth — but we need to verify DID exists
    // We'll check in a useEffect-like pattern after re-render
  }, []);

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

      <CopyCommand
        command={"auths init\nauths id register"}
        label="Run these commands in your terminal:"
      />

      <p className="text-xs text-zinc-500">
        This generates an Ed25519 keypair, stores it in your platform keychain, creates a KERI inception event, and registers your DID on the network.
      </p>

      {!isAuthenticated ? (
        <div className="mt-6">
          <p className="text-sm text-zinc-400 mb-3">
            After running the commands above, prove you own the identity:
          </p>
          <ChallengeAuth onSuccess={handleAuthSuccess} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <p className="text-sm text-emerald-400">
              Authenticated as <code className="font-mono text-xs">{auth?.did}</code>
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/individual/identity-step.tsx
git commit -m "feat: add identity step with DID challenge auth for individual onboarding"
```

---

## Task 7: Individual Flow — Publish Step

**Files:**
- Create: `apps/web/src/app/try/individual/publish-step.tsx`

**Step 1: Create component**

```typescript
'use client';

import { useCallback, useState } from 'react';
import { CopyCommand } from '@/components/copy-command';
import { useAuth } from '@/lib/auth/auth-context';
import { fetchArtifacts } from '@/lib/api/registry';
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
      // Search for artifacts by this signer's DID
      const res = await fetchArtifacts(auth.did);
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
        command={"auths artifact sign ./my-package-1.0.0.tar.gz\nauths artifact publish"}
        label="Run these commands in your terminal:"
      />

      <p className="text-xs text-zinc-500">
        The first command creates a <code className="text-zinc-400">.auths.json</code> attestation. The second publishes it to the public transparency log where anyone can verify it.
      </p>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/individual/publish-step.tsx
git commit -m "feat: add publish step with registry verification for individual onboarding"
```

---

## Task 8: Individual Flow — Completion View

**Files:**
- Create: `apps/web/src/app/try/individual/completion.tsx`

**Step 1: Create component**

```typescript
'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import type { ArtifactEntry } from '@/lib/api/registry';
import { AuthsVerifyWidget } from '@/components/auths-verify-widget';

interface CompletionProps {
  artifact: ArtifactEntry | null;
  redirectTo?: string;
}

export function Completion({ artifact, redirectTo }: CompletionProps) {
  const { auth } = useAuth();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h3 className="text-xl font-semibold text-zinc-100 mb-2">
          You&apos;re set up
        </h3>
        <p className="text-sm text-zinc-400">
          Your identity is live and your first artifact is published on the transparency log.
        </p>
      </div>

      {artifact && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
          <h4 className="text-sm font-semibold text-zinc-200 mb-3">Published artifact</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Package</dt>
              <dd className="text-zinc-200 font-mono text-xs">{artifact.package_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Digest</dt>
              <dd className="text-zinc-200 font-mono text-xs">{artifact.digest_hex.slice(0, 16)}...</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Published</dt>
              <dd className="text-zinc-200">{new Date(artifact.published_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 text-center">
        <h4 className="text-lg font-semibold text-zinc-100 mb-2">Verify in your browser</h4>
        <p className="text-sm text-zinc-400 mb-4">
          Drop any <code className="text-emerald-400">.auths.json</code> attestation file to verify it via WebAssembly.
        </p>
        <AuthsVerifyWidget mode="detail" size="lg" />
      </div>

      <div className="flex gap-4 justify-center">
        {redirectTo ? (
          <>
            <Link
              href={redirectTo}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
            >
              Continue to join org
            </Link>
            <Link
              href="/registry"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Explore the registry
            </Link>
          </>
        ) : (
          <>
            <Link
              href={auth ? `/registry/identity/${encodeURIComponent(auth.did)}` : '/registry'}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
            >
              Explore the registry
            </Link>
            <Link
              href="/try?flow=org"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Set up an organization
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/individual/completion.tsx
git commit -m "feat: add completion view with WASM demo for individual onboarding"
```

---

## Task 9: Individual Flow — Orchestrator

Compose the three steps into the sequential wizard.

**Files:**
- Create: `apps/web/src/app/try/individual/individual-flow.tsx`

**Step 1: Create orchestrator**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InstallStep } from './install-step';
import { IdentityStep } from './identity-step';
import { PublishStep } from './publish-step';
import { Completion } from './completion';
import type { ArtifactEntry } from '@/lib/api/registry';

type IndividualStep = 1 | 2 | 3 | 'done';

interface IndividualFlowProps {
  redirectTo?: string;
}

const STEP_LABELS = ['Install', 'Create Identity', 'Publish'];

export function IndividualFlow({ redirectTo }: IndividualFlowProps) {
  const [currentStep, setCurrentStep] = useState<IndividualStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [did, setDid] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<ArtifactEntry | null>(null);

  const completeStep = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set(prev).add(step));
  }, []);

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isComplete = completedSteps.has(stepNum);
          const isCurrent = currentStep === stepNum;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isComplete
                      ? 'bg-emerald-500 text-zinc-950'
                      : isCurrent
                        ? 'bg-zinc-700 text-white'
                        : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isComplete ? '\u2713' : stepNum}
                </span>
                <span
                  className={`text-sm truncate ${
                    isCurrent ? 'text-zinc-100' : 'text-zinc-500'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    isComplete ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={String(currentStep)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && (
            <InstallStep
              onComplete={() => {
                completeStep(1);
                setCurrentStep(2);
              }}
            />
          )}

          {currentStep === 2 && (
            <IdentityStep
              onComplete={(completedDid) => {
                setDid(completedDid);
                completeStep(2);
                setCurrentStep(3);
              }}
            />
          )}

          {currentStep === 3 && (
            <PublishStep
              onComplete={(publishedArtifact) => {
                setArtifact(publishedArtifact);
                completeStep(3);
                setCurrentStep('done');
              }}
            />
          )}

          {currentStep === 'done' && (
            <Completion artifact={artifact} redirectTo={redirectTo} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/individual/individual-flow.tsx
git commit -m "feat: add individual onboarding flow orchestrator with step indicator"
```

---

## Task 10: Org Flow — Task Card Shell

Create the reusable task card component for the org wizard's free-form cards.

**Files:**
- Create: `apps/web/src/app/try/org/task-card.tsx`

**Step 1: Create component**

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type CardStatus = 'not-started' | 'in-progress' | 'complete';

interface TaskCardProps {
  title: string;
  description: string;
  status: CardStatus;
  disabled?: boolean;
  children: React.ReactNode;
}

const STATUS_CONFIG: Record<CardStatus, { label: string; dotClass: string }> = {
  'not-started': { label: 'Not started', dotClass: 'bg-zinc-600' },
  'in-progress': { label: 'In progress', dotClass: 'bg-yellow-400' },
  complete: { label: 'Complete', dotClass: 'bg-emerald-500' },
};

export function TaskCard({ title, description, status, disabled, children }: TaskCardProps) {
  const [expanded, setExpanded] = useState(status === 'in-progress');
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`rounded-xl border p-6 transition-colors ${
        status === 'complete'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : disabled
            ? 'border-zinc-800 bg-zinc-950/30 opacity-60'
            : 'border-zinc-800 bg-zinc-950/50'
      }`}
    >
      <button
        type="button"
        onClick={() => !disabled && setExpanded((e) => !e)}
        disabled={disabled}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
            <span className="text-xs text-zinc-500">{config.label}</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
          <p className="text-sm text-zinc-400 mt-1">{description}</p>
        </div>
        {!disabled && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-zinc-500 transition-transform shrink-0 ml-4 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-zinc-800">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/org/task-card.tsx
git commit -m "feat: add TaskCard shell component for org onboarding flow"
```

---

## Task 11: Org Flow — Create Org Card

**Files:**
- Create: `apps/web/src/app/try/org/create-org-card.tsx`

**Step 1: Create component**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { createOrg } from '@/lib/api/registry';
import { TaskCard } from './task-card';

interface CreateOrgCardProps {
  orgDid: string | null;
  onComplete: (orgDid: string, orgName: string) => void;
}

export function CreateOrgCard({ orgDid, onComplete }: CreateOrgCardProps) {
  const { auth } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = orgDid ? 'complete' : 'not-started';

  const handleCreate = useCallback(async () => {
    if (!auth || !orgName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createOrg(orgName.trim(), auth.token);
      onComplete(res.org_did, res.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  }, [auth, orgName, onComplete]);

  return (
    <TaskCard
      title="Create Organization"
      description={orgDid ? `Created: ${orgDid.slice(0, 24)}...` : 'Set up a new org with a name and DID'}
      status={status}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Organization name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="my-team"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting || !orgName.trim()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating...' : 'Create organization'}
        </button>
      </div>
    </TaskCard>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/org/create-org-card.tsx
git commit -m "feat: add create org card for org onboarding"
```

---

## Task 12: Org Flow — Invite Card

**Files:**
- Create: `apps/web/src/app/try/org/invite-card.tsx`

**Step 1: Create component**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { createInvite } from '@/lib/api/registry';
import type { InviteResponse } from '@/lib/api/registry';
import { CopyCommand } from '@/components/copy-command';
import { TaskCard } from './task-card';

interface InviteCardProps {
  orgDid: string | null;
}

export function InviteCard({ orgDid }: InviteCardProps) {
  const { auth } = useAuth();
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [expiresIn, setExpiresIn] = useState('7d');
  const [invites, setInvites] = useState<InviteResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = invites.length > 0 ? 'complete' : 'not-started';

  const handleInvite = useCallback(async () => {
    if (!auth || !orgDid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createInvite(orgDid, role, expiresIn, auth.token);
      setInvites((prev) => [res, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setSubmitting(false);
    }
  }, [auth, orgDid, role, expiresIn]);

  return (
    <TaskCard
      title="Invite Members"
      description={
        invites.length > 0
          ? `${invites.length} invite${invites.length > 1 ? 's' : ''} created`
          : 'Generate shareable invite links for your team'
      }
      status={status}
      disabled={!orgDid}
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-zinc-400 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-zinc-400 mb-1">Expires in</label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleInvite}
          disabled={submitting || !orgDid}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating invite...' : 'Create invite link'}
        </button>

        {invites.length > 0 && (
          <div className="space-y-3 pt-2">
            {invites.map((invite) => (
              <div key={invite.short_code} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                <CopyCommand command={`auths org join --code ${invite.short_code}`} />
                <p className="text-xs text-zinc-500">
                  Invite link: {invite.invite_url} &middot; Expires: {new Date(invite.expires_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TaskCard>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/org/invite-card.tsx
git commit -m "feat: add invite card for org onboarding"
```

---

## Task 13: Org Flow — Policy Card

**Files:**
- Create: `apps/web/src/app/try/org/policy-card.tsx`

**Step 1: Create component**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { setOrgPolicy } from '@/lib/api/registry';
import { CopyCommand } from '@/components/copy-command';
import { TaskCard } from './task-card';

interface PolicyCardProps {
  orgDid: string | null;
  policySet: boolean;
  onComplete: () => void;
}

export function PolicyCard({ orgDid, policySet, onComplete }: PolicyCardProps) {
  const { auth } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = policySet ? 'complete' : 'not-started';

  const handleSetPolicy = useCallback(async () => {
    if (!auth || !orgDid) return;
    setSubmitting(true);
    setError(null);
    try {
      await setOrgPolicy(orgDid, true, auth.token);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set signing policy');
    } finally {
      setSubmitting(false);
    }
  }, [auth, orgDid, onComplete]);

  return (
    <TaskCard
      title="Set Signing Policy"
      description={policySet ? 'All commits must be signed' : 'Require signed commits from org members'}
      status={status}
      disabled={!orgDid}
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          First, set up each repo to use Auths signatures:
        </p>

        <CopyCommand
          command={`auths git setup\nauths signers sync --org "${orgDid ?? '<org-did>'}"\ngit config commit.gpgsign true`}
          label="Run in each repository:"
        />

        <p className="text-sm text-zinc-400">
          Then enable the org-wide policy:
        </p>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSetPolicy}
          disabled={submitting || !orgDid}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Enabling...' : 'Require all commits to be signed'}
        </button>
      </div>
    </TaskCard>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/org/policy-card.tsx
git commit -m "feat: add policy card for org onboarding"
```

---

## Task 14: Org Flow — Summary Dashboard

**Files:**
- Create: `apps/web/src/app/try/org/summary-dashboard.tsx`

**Step 1: Create component**

```typescript
'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { fetchOrgStatus } from '@/lib/api/registry';

interface SummaryDashboardProps {
  orgDid: string;
  orgName: string;
}

export function SummaryDashboard({ orgDid, orgName }: SummaryDashboardProps) {
  const { auth } = useAuth();

  const { data: status } = useQuery({
    queryKey: ['org-status', orgDid],
    queryFn: ({ signal }) => fetchOrgStatus(orgDid, auth!.token, signal),
    enabled: !!auth,
    refetchInterval: 10_000,
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h3 className="text-xl font-semibold text-zinc-100 mb-2">
          {orgName} is set up
        </h3>
        <p className="text-sm text-zinc-400">
          Your organization is live on the Auths network.
        </p>
      </div>

      {status && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{status.member_count}</p>
            <p className="text-xs text-zinc-500 mt-1">Members</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{status.pending_invites}</p>
            <p className="text-xs text-zinc-500 mt-1">Pending invites</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className={`text-2xl font-bold ${status.signing_policy_enabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {status.signing_policy_enabled ? 'On' : 'Off'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Signing policy</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <Link
          href={`/registry/org/${encodeURIComponent(orgDid)}`}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          View on registry
        </Link>
        <Link
          href="/registry"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
        >
          Explore the registry
        </Link>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/org/summary-dashboard.tsx
git commit -m "feat: add summary dashboard for org onboarding"
```

---

## Task 15: Org Flow — Orchestrator

Compose the three cards + auth + summary into the org wizard.

**Files:**
- Create: `apps/web/src/app/try/org/org-flow.tsx`

**Step 1: Create orchestrator**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { ChallengeAuth } from '@/components/challenge-auth';
import { CreateOrgCard } from './create-org-card';
import { InviteCard } from './invite-card';
import { PolicyCard } from './policy-card';
import { SummaryDashboard } from './summary-dashboard';

export function OrgFlow() {
  const { isAuthenticated } = useAuth();
  const [orgDid, setOrgDid] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [policySet, setPolicySet] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const handleOrgCreated = useCallback((did: string, name: string) => {
    setOrgDid(did);
    setOrgName(name);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            Authenticate to get started
          </h3>
          <p className="text-sm text-zinc-400 mb-4">
            You need an Auths identity to create an organization. Don&apos;t have one?{' '}
            <a href="/try?flow=individual" className="text-emerald-400 hover:text-emerald-300">
              Set up your individual identity first.
            </a>
          </p>
        </div>
        <ChallengeAuth />
      </div>
    );
  }

  if (showDashboard && orgDid && orgName) {
    return <SummaryDashboard orgDid={orgDid} orgName={orgName} />;
  }

  return (
    <div className="space-y-4">
      <CreateOrgCard orgDid={orgDid} onComplete={handleOrgCreated} />
      <InviteCard orgDid={orgDid} />
      <PolicyCard orgDid={orgDid} policySet={policySet} onComplete={() => setPolicySet(true)} />

      {orgDid && (
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowDashboard(true)}
            className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
          >
            View dashboard
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/app/try/org/org-flow.tsx
git commit -m "feat: add org onboarding flow orchestrator with auth gate"
```

---

## Task 16: Unified /try Page — Server + Client Components

Create the main `/try` page with flow selector.

**Files:**
- Create: `apps/web/src/app/try/page.tsx`
- Create: `apps/web/src/app/try/try-client.tsx`

**Step 1: Create the server component**

`apps/web/src/app/try/page.tsx`:

```typescript
import { Suspense } from 'react';
import { constructMetadata } from '@/lib/metadata';
import { TryClient } from './try-client';

export const metadata = constructMetadata({
  title: 'Onboarding | Auths',
  description:
    'Get started with Auths in minutes. Set up your cryptographic identity or onboard your organization.',
});

type Props = {
  searchParams: Promise<{ flow?: string; redirect?: string }>;
};

export default async function TryPage({ searchParams }: Props) {
  const { flow, redirect } = await searchParams;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <section className="pt-28 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-zinc-900" />}>
            <TryClient initialFlow={flow as 'individual' | 'org' | undefined} redirectTo={redirect} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Create the client component**

`apps/web/src/app/try/try-client.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { IndividualFlow } from './individual/individual-flow';
import { OrgFlow } from './org/org-flow';

type Flow = 'individual' | 'org';

interface TryClientProps {
  initialFlow?: Flow;
  redirectTo?: string;
}

export function TryClient({ initialFlow, redirectTo }: TryClientProps) {
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(initialFlow ?? null);

  return (
    <AuthProvider>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Onboarding</h1>
          <p className="text-zinc-400">
            Get started with Auths. Choose your path.
          </p>
        </div>

        {/* Flow selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedFlow('individual')}
            className={`rounded-xl border p-6 text-left transition-all ${
              selectedFlow === 'individual'
                ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
            }`}
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Individuals</h2>
            <p className="text-sm text-zinc-400">
              Create your cryptographic identity, sign and publish your first artifact.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFlow('org')}
            className={`rounded-xl border p-6 text-left transition-all ${
              selectedFlow === 'org'
                ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
            }`}
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Organizations</h2>
            <p className="text-sm text-zinc-400">
              Set up your team, invite members, and enforce signed commits.
            </p>
          </button>
        </div>

        {/* Selected flow content */}
        <AnimatePresence mode="wait">
          {selectedFlow && (
            <motion.div
              key={selectedFlow}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="border-t border-zinc-800 pt-10">
                {selectedFlow === 'individual' && (
                  <IndividualFlow redirectTo={redirectTo} />
                )}
                {selectedFlow === 'org' && <OrgFlow />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthProvider>
  );
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 4: Verify dev server renders the page**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm --filter web dev &` then `curl -s http://localhost:3000/try | head -20`
Expected: HTML output containing "Onboarding"

**Step 5: Commit**

```bash
git add apps/web/src/app/try/
git commit -m "feat: add unified /try onboarding page with individual and org flow selector"
```

---

## Task 17: Join Page

Create the `/join/[code]` route for org invite links.

**Files:**
- Create: `apps/web/src/app/join/[code]/page.tsx`
- Create: `apps/web/src/app/join/[code]/join-client.tsx`

**Step 1: Create server component**

`apps/web/src/app/join/[code]/page.tsx`:

```typescript
import { Suspense } from 'react';
import { constructMetadata } from '@/lib/metadata';
import { JoinClient } from './join-client';

export const metadata = constructMetadata({
  title: 'Join Organization | Auths',
  description: 'Accept an invitation to join an Auths organization.',
});

type Props = {
  params: Promise<{ code: string }>;
};

export default async function JoinPage({ params }: Props) {
  const { code } = await params;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <section className="pt-28 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-900" />}>
            <JoinClient code={code} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Create client component**

`apps/web/src/app/join/[code]/join-client.tsx`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchInviteDetails } from '@/lib/api/registry';
import { CopyCommand } from '@/components/copy-command';

interface JoinClientProps {
  code: string;
}

export function JoinClient({ code }: JoinClientProps) {
  const { data: invite, isLoading, isError } = useQuery({
    queryKey: ['invite', code],
    queryFn: ({ signal }) => fetchInviteDetails(code, signal),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-800" />
        <div className="h-32 animate-pulse rounded-xl bg-zinc-900" />
      </div>
    );
  }

  if (isError || !invite) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Invalid or expired invite</h2>
        <p className="text-sm text-zinc-400">
          This invite link may have expired. Ask the organization admin for a new one.
        </p>
      </div>
    );
  }

  if (invite.status === 'expired') {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <h2 className="text-lg font-semibold text-yellow-400 mb-2">Invite expired</h2>
        <p className="text-sm text-zinc-400">
          This invite expired on {new Date(invite.expires_at).toLocaleDateString()}.
          Ask the organization admin for a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Join {invite.org_name}
        </h1>
        <p className="text-zinc-400">
          You&apos;ve been invited to join as a <span className="text-emerald-400 font-medium">{invite.role}</span>.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 space-y-4">
        <CopyCommand
          command={`auths org join --code ${code}`}
          label="Run this in your terminal:"
        />
        <p className="text-xs text-zinc-500">
          Expires: {new Date(invite.expires_at).toLocaleDateString()}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 text-center">
        <p className="text-sm text-zinc-400 mb-3">
          Don&apos;t have Auths yet?
        </p>
        <Link
          href={`/try?flow=individual&redirect=${encodeURIComponent(`/join/${code}`)}`}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          Set up your identity first
        </Link>
      </div>
    </div>
  );
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 4: Commit**

```bash
git add apps/web/src/app/join/
git commit -m "feat: add /join/[code] page for org invite links"
```

---

## Task 18: Add /try to Site Navigation

**Files:**
- Modify: `apps/web/src/components/site-nav.tsx:17-21`

**Step 1: Add "Get Started" link to NAV_LINKS**

Change the `NAV_LINKS` array from:

```typescript
const NAV_LINKS = [
  { label: 'Overview', href: '/' },
  { label: 'Registry', href: '/registry' },
  { label: 'Network', href: '/network' },
];
```

To:

```typescript
const NAV_LINKS = [
  { label: 'Overview', href: '/' },
  { label: 'Registry', href: '/registry' },
  { label: 'Network', href: '/network' },
  { label: 'Get Started', href: '/try' },
];
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/components/site-nav.tsx
git commit -m "feat: add Get Started link to site navigation"
```

---

## Task 19: Final Verification

**Step 1: Full TypeScript check**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm exec tsc --noEmit -p apps/web/tsconfig.json`
Expected: No errors

**Step 2: Build check**

Run: `cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm --filter web build`
Expected: Build succeeds

**Step 3: Verify all new files exist**

Run: `find apps/web/src/app/try apps/web/src/app/join apps/web/src/lib/auth apps/web/src/components/challenge-auth.tsx apps/web/src/components/copy-command.tsx -type f | sort`

Expected output:
```
apps/web/src/app/join/[code]/join-client.tsx
apps/web/src/app/join/[code]/page.tsx
apps/web/src/app/try/individual/completion.tsx
apps/web/src/app/try/individual/identity-step.tsx
apps/web/src/app/try/individual/individual-flow.tsx
apps/web/src/app/try/individual/install-step.tsx
apps/web/src/app/try/individual/publish-step.tsx
apps/web/src/app/try/org/create-org-card.tsx
apps/web/src/app/try/org/invite-card.tsx
apps/web/src/app/try/org/org-flow.tsx
apps/web/src/app/try/org/policy-card.tsx
apps/web/src/app/try/org/summary-dashboard.tsx
apps/web/src/app/try/org/task-card.tsx
apps/web/src/app/try/page.tsx
apps/web/src/app/try/try-client.tsx
apps/web/src/components/challenge-auth.tsx
apps/web/src/components/copy-command.tsx
apps/web/src/lib/auth/auth-context.tsx
```

**Step 4: Commit all remaining changes if any**

```bash
git add -A
git status
```
