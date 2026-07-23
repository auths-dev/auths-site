'use client';

export function IamBiometricSection() {
  return (
    <section className="my-10 bg-paper-elevated border border-rule rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Editorial Copy */}
        <div className="md:col-span-7">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider font-bold text-seal bg-seal/10 border border-seal/20 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-seal animate-pulse"></span>
            <span>PASSKEY & PAM · ZERO STATIC SECRETS</span>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl text-ink leading-tight">
            Ephemeral Touch ID Presentations for <span className="italic text-seal">SSH & Kubernetes</span>
          </h3>
          <p className="mt-3 text-xs md:text-sm text-ink-soft leading-relaxed">
            Eliminate static SSH private keys like <code className="font-mono text-ink bg-paper px-1.5 py-0.5 rounded border border-rule">.ssh/id_rsa</code> and long-lived AWS IAM secret keys. Developers authenticate terminal access via Touch ID.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> Linux/macOS PAM Integration
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> kubectl Credential Plugin
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> Issuerless Presentations
            </span>
          </div>
        </div>

        {/* Right Compact Sequence Terminal Box */}
        <div className="md:col-span-5 bg-paper border border-rule rounded-xl p-4 font-mono text-xs shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-ink-faint pb-3 mb-3 border-b border-rule">
            <span>ZERO_TRUST_AUTH_FLOW</span>
            <span className="text-seal font-semibold">Zero-Trust Access</span>
          </div>
          <div className="space-y-2 text-[11px] text-ink-soft">
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">01</span>
              <span>Developer initiates SSH or kubectl access</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">02</span>
              <span>Local daemon prompts Touch ID</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">03</span>
              <span>Presentation challenge issued to device</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">04</span>
              <span>Infrastructure verifies proof & opens session</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
