'use client';

import { motion } from 'motion/react';

const MURMUR_STEPS = [
  {
    step: '01',
    title: 'Sealed Envelope Deposit',
    subtitle: 'Agent -> Murmur Relay',
    desc: 'When an AI agent requests an elevated spend or high-risk capability, it creates a sealed challenge envelope and deposits it at murmur-relay.fly.dev.',
    tag: 'Zero Knowledge',
  },
  {
    step: '02',
    title: 'Instant Mobile Push',
    subtitle: 'Murmur Relay -> iPhone / Mac',
    desc: 'The maintainer’s phone running the native Murmur app receives an encrypted push notification. Neither Fly.io nor AWS can decrypt the payload.',
    tag: 'Signal Protocol',
  },
  {
    step: '03',
    title: 'Biometric Touch ID / Face ID',
    subtitle: 'Liquid Glass Native App',
    desc: 'The maintainer approves the request with a Touch ID / Face ID tap inside the Liquid Glass SwiftUI interface. The key never leaves the device’s Secure Enclave.',
    tag: 'Hardware-Backed',
  },
  {
    step: '04',
    title: 'Signed Assertion Drain',
    subtitle: 'Murmur App -> Cloud Agent',
    desc: 'The sealed approval assertion is deposited back to the relay. The cloud agent drains it, verifies the signature against the maintainer DID, and resumes work.',
    tag: 'Instant Resume',
  },
];

export function AgentGuardMurmurSection() {
  return (
    <section className="my-16 bg-paper-elevated border border-rule rounded-2xl p-8 shadow-lg">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-block px-3 py-1 font-mono text-[11px] uppercase tracking-wider font-bold text-seal bg-seal/10 border border-seal/20 rounded-full mb-3">
          [HUMAN-IN-THE-LOOP] · MURMUR MOBILE APPROVALS
        </div>
        <h3 className="font-serif text-3xl md:text-4xl text-ink">
          Encrypted Touch ID Approvals via Murmur
        </h3>
        <p className="mt-3 text-sm text-ink-soft leading-relaxed">
          Need human approval for a $5,000 deployment? The agent sends an encrypted request to your iPhone via <strong className="text-ink">Murmur</strong>—no open inbound ports, no master API keys required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MURMUR_STEPS.map((item, idx) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-xl border border-rule bg-paper hover:border-seal/40 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-seal bg-seal/10 px-2 py-0.5 rounded">
                  STEP {item.step}
                </span>
                <span className="font-mono text-[10px] uppercase font-semibold text-ink-faint">
                  {item.tag}
                </span>
              </div>
              <h4 className="font-serif text-xl text-ink mb-1">{item.title}</h4>
              <p className="font-mono text-xs text-seal-deep mb-3">{item.subtitle}</p>
              <p className="text-xs text-ink-soft leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
