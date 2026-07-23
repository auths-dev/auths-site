'use client';

export function SupplyChainHardwareSection() {
  return (
    <section className="my-10 bg-paper-elevated border border-rule rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Editorial Copy */}
        <div className="md:col-span-7">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider font-bold text-seal bg-seal/10 border border-seal/20 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-seal animate-pulse"></span>
            <span>SECURE ENCLAVE P-256 · HARDWARE ATTESTATION</span>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl text-ink leading-tight">
            Hardware-Anchored <span className="italic text-seal">SLSA L3 Release Provenance</span>
          </h3>
          <p className="mt-3 text-xs md:text-sm text-ink-soft leading-relaxed">
            Eliminate centralized Certificate Authorities and vulnerable CI runner credentials. Every release binary is signed directly by maintainer hardware keys (Secure Enclave / Passkeys) and attested via in-toto SLSA Level 3 statements verifiable 100% offline.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> Zero-CA Architecture
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> In-Toto SLSA v0.2
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> Offline WASM Verification
            </span>
          </div>
        </div>

        {/* Right Compact Sequence Terminal Box */}
        <div className="md:col-span-5 bg-paper border border-rule rounded-xl p-4 font-mono text-xs shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-ink-faint pb-3 mb-3 border-b border-rule">
            <span>CI_PROVENANCE_FLOW</span>
            <span className="text-seal font-semibold">SLSA L3 Provenance</span>
          </div>
          <div className="space-y-2 text-[11px] text-ink-soft">
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">01</span>
              <span>Maintainer signs commit via Secure Enclave</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">02</span>
              <span>CI runner builds release binary artifact</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">03</span>
              <span>SLSA L3 in-toto statement generated</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">04</span>
              <span>Production gateway verifies provenance offline</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
