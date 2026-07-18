/**
 * The v0 AuthPort adapter: GitHub OAuth via Supabase.
 *
 * Everything Supabase-auth-specific lives here and in `src/lib/supabase/`.
 * See `port.ts` for why (the Auths-native adapter is the planned second
 * implementation).
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AuthPort, SellerIdentity } from './port';

function toIdentity(user: {
  id: string;
  user_metadata: Record<string, unknown>;
  identities?: { provider: string; id: string }[] | null;
}): SellerIdentity {
  const github = user.identities?.find((i) => i.provider === 'github');
  return {
    id: user.id,
    provider: 'github',
    subject: github?.id ?? user.id,
    githubLogin: (user.user_metadata.user_name as string | undefined) ?? null,
    authsRoot: null,
  };
}

export const auth: AuthPort = {
  async getSession() {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user ? toIdentity(data.user) : null;
  },

  async signIn(redirectTo: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) {
      throw new Error(`sign-in could not start: ${error?.message ?? 'no URL returned'}`);
    }
    return data.url;
  },

  async signOut() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  },

  async requireSeller() {
    const identity = await this.getSession();
    if (!identity) redirect('/login');
    const supabase = await createSupabaseServerClient();
    await supabase.from('sellers').upsert(
      {
        id: identity.id,
        auth_provider: identity.provider,
        auth_subject: identity.subject,
        github_login: identity.githubLogin,
      },
      { onConflict: 'id' },
    );
    return identity;
  },
};
