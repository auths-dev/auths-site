'use client';

export function NetworkQuorumSection() {
  return (
    <section className="my-10 bg-paper-elevated border border-rule rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Editorial Copy */}
        <div className="md:col-span-7">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider font-bold text-seal bg-seal/10 border border-seal/20 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-seal animate-pulse"></span>
            <span>TRANSPARENCY LOG · ANTI-EQUIVOCATION QUORUM</span>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl text-ink leading-tight">
            Multi-Cloud Co-Signing Witnesses for <span className="italic text-seal">KEL & Merkle Proofs</span>
          </h3>
          <p className="mt-3 text-xs md:text-sm text-ink-soft leading-relaxed">
            Guarantee identity chain freshness and anti-duplicity. Independent multi-region witness nodes co-sign KERI key event sequences, verify Merkle inclusion consistency, and serve state over native Git smart-HTTP.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> 4 Trust Roles (anchor, kel, cosign, registry)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> Multi-Region Fly.io & Cloud KMS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> C2SP Witness Protocol
            </span>
          </div>
        </div>

        {/* Right Compact Sequence Terminal Box */}
        <div className="md:col-span-5 bg-paper border border-rule rounded-xl p-4 font-mono text-xs shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-ink-faint pb-3 mb-3 border-b border-rule">
            <span>WITNESS_QUORUM_FLOW</span>
            <span className="text-seal font-semibold">auths-witness-node</span>
          </div>
          <div className="space-y-2 text-[11px] text-ink-soft">
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">01</span>
              <span>Client submits spend or key checkpoint</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">02</span>
              <span>Witness checks anti-duplicity memory (HTTP 422)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">03</span>
              <span>Merkle consistency proof co-signed by quorum</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">04</span>
              <span>State served over refs/auths/* via Git smart-HTTP</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
