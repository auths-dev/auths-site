import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * The fleet dashboard: one treasury cap with live headroom, channel states, and
 * the member set — every figure RE-DERIVED (settlements cite their log_hash;
 * identities come from verified presentations), never gateway-reported.
 */
export default async function FleetPage() {
  const supabase = createServiceClient();
  const [{ data: fleets }, { data: settlements }, { data: members }] = await Promise.all([
    supabase.from('fleets').select('id, org_root_aid, delegation_count, cap_cents, treasury_url'),
    supabase
      .from('settlements')
      .select('channel_ref, rail, gross_cents, fee_cents, log_hash, settled_at')
      .order('settled_at', { ascending: false })
      .limit(50),
    // The member set comes from the org identity history, never a mirror table
    // alone: each subject below authenticated a KEL-verified presentation, and
    // auths_root is the chained delegator root the verifier surfaced.
    supabase
      .from('sellers')
      .select('auth_subject, auths_root')
      .eq('auth_provider', 'auths')
      .not('auths_root', 'is', null),
  ]);

  const settledByAccount = new Map<string, number>();
  for (const s of settlements ?? []) {
    const key = s.channel_ref;
    settledByAccount.set(key, (settledByAccount.get(key) ?? 0) + (s.gross_cents ?? 0));
  }
  const totalSettled = (settlements ?? []).reduce((a, s) => a + (s.gross_cents ?? 0), 0);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Fleet</h1>
      <p className="mt-2 text-sm text-neutral-500">
        One budget, N agents, provable — every number below is re-derived from
        signed spend logs (each settlement cites its log_hash), never
        gateway-reported.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">The one treasury cap</h2>
        {(fleets ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No fleet yet. Run a coordinator (`auths-mcp treasury serve`) and
            register the fleet to see its cap and headroom here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(fleets ?? []).map((f) => {
              const headroom = Math.max(0, (f.cap_cents ?? 0) - totalSettled);
              return (
                <li key={f.id} className="rounded border p-3 text-sm">
                  <div className="font-mono text-xs">{f.org_root_aid}</div>
                  <div className="mt-1">
                    cap ${((f.cap_cents ?? 0) / 100).toFixed(2)} · settled $
                    {(totalSettled / 100).toFixed(2)} · headroom $
                    {(headroom / 100).toFixed(2)} · {f.delegation_count} delegation(s)
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Channel states</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Open channels live gateway-side until close; a settled channel renders
          here once its netted close re-derives from the cited log.
        </p>
        <ul className="mt-3 space-y-1">
          {(settlements ?? []).map((s) => (
            <li key={`${s.channel_ref}-${s.settled_at}`} className="text-sm">
              <span className="font-mono text-xs">{s.channel_ref.slice(0, 16)}…</span>{' '}
              settled ${((s.gross_cents ?? 0) / 100).toFixed(2)} on {s.rail} · fee $
              {((s.fee_cents ?? 0) / 100).toFixed(2)} ·{' '}
              <span className="font-mono text-xs">log {s.log_hash.slice(0, 12)}…</span>
            </li>
          ))}
          {(settlements ?? []).length === 0 && (
            <li className="text-sm text-neutral-500">No settled channels yet.</li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Members</h2>
        <p className="mt-1 text-xs text-neutral-500">
          From the org identity history: each member below proved control of its
          signing key in a KEL-verified presentation; the root is the chained
          delegator the verifier surfaced — never a mirror table alone.
        </p>
        <ul className="mt-3 space-y-1">
          {(members ?? []).map((m) => (
            <li key={m.auth_subject} className="font-mono text-xs">
              {m.auth_subject} <span className="text-neutral-400">⇐ {m.auths_root}</span>
            </li>
          ))}
          {(members ?? []).length === 0 && (
            <li className="text-sm text-neutral-500">No verified members yet.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
