/**
 * AuthPort — the ONLY seam through which the app touches authentication.
 *
 * WHY A PORT (read before adding an import of any auth SDK elsewhere):
 * v0 signs sellers in with GitHub OAuth via Supabase. The planned second
 * adapter is **Auths-native login** — a seller proves control of their
 * auths root identity (device-bound key, key-event-log verified) instead
 * of, or in addition to, GitHub. That adapter will populate
 * `SellerIdentity.authsRoot` with the PROVEN root identifier, which
 * unlocks the top badge tier ("Auths-verified seller"). Nothing outside
 * `src/lib/auth/` may import a concrete auth SDK — an ESLint
 * no-restricted-imports fence enforces this — so swapping or adding
 * adapters touches exactly one directory.
 */

export interface SellerIdentity {
  /** Stable seller id — equals the row id in `sellers` (auth user id). */
  id: string;
  /** The provider that authenticated this session (v0: 'github'). */
  provider: 'github' | 'auths';
  /** Provider-scoped subject (GitHub user id, or the auths root AID). */
  subject: string;
  /** GitHub login when known — display + profile links. */
  githubLogin: string | null;
  /**
   * Proven auths root identifier. ALWAYS null from the GitHub adapter.
   * Only the future Auths-native adapter may set it, and only after
   * cryptographic proof — never from user input.
   */
  authsRoot: string | null;
}

export interface AuthPort {
  /** The signed-in seller, or null. Never throws on anonymous. */
  getSession(): Promise<SellerIdentity | null>;
  /** Begin sign-in; returns the URL to redirect the browser to. */
  signIn(redirectTo: string): Promise<string>;
  /** End the session. */
  signOut(): Promise<void>;
  /**
   * getSession plus a guarantee that the `sellers` row exists (first
   * sign-in creates it). Use in flows that write seller-owned rows.
   */
  requireSeller(): Promise<SellerIdentity>;
}
