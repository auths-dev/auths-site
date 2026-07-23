'use client';

import { motion } from 'motion/react';

export function AgentGuardMurmurSection() {
  return (
    <section className="my-10 bg-paper-elevated border border-rule rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Editorial Copy */}
        <div className="md:col-span-7">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider font-bold text-seal bg-seal/10 border border-seal/20 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-seal animate-pulse"></span>
            <span>NATIVE APPLE APP · MURMUR INTEGRATION</span>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl text-ink leading-tight">
            Encrypted Touch ID Approvals via <span className="italic text-seal">Murmur</span>
          </h3>
          <p className="mt-3 text-xs md:text-sm text-ink-soft leading-relaxed">
            When an AI agent requests an elevated spend or high-risk capability, it deposits a sealed challenge envelope at <code className="font-mono text-ink bg-paper px-1.5 py-0.5 rounded border border-rule">murmur-relay.fly.dev</code>. You receive an instant Face ID prompt on your iPhone or Mac—no inbound open ports, no master keys exposed.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> Zero Knowledge
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> Signal Protocol Ratchet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-seal font-bold">✓</span> Secure Enclave Bound
            </span>
          </div>
        </div>

        {/* Right Compact Sequence Terminal Box */}
        <div className="md:col-span-5 bg-paper border border-rule rounded-xl p-4 font-mono text-xs shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-ink-faint pb-3 mb-3 border-b border-rule">
            <span>MURMUR_RELAY_FLOW</span>
            <span className="text-seal font-semibold">https://murmur-relay.fly.dev</span>
          </div>
          <div className="space-y-2 text-[11px] text-ink-soft">
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">01</span>
              <span>Agent deposits sealed envelope to mailbox</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">02</span>
              <span>Encrypted push sent to Murmur iOS app</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">03</span>
              <span>Maintainer approves via Touch ID assertion</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-seal font-bold">04</span>
              <span>Agent drains signed proof & resumes execution</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
