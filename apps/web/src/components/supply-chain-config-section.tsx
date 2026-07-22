'use client';

import { useState } from 'react';

export function SupplyChainConfigSection() {
  const [activeTab, setActiveTab] = useState<'hook' | 'action' | 'verify'>('hook');

  const configs = {
    hook: {
      path: 'prepare-commit-msg (Local Git Hook)',
      label: 'Git Hook Setup',
      code: `# Install Auths Git commit hook locally
auths commit-hooks install

# Automatically signs commits using Secure Enclave P-256 key
git commit -m "feat(core): implement SLSA provenance"`,
    },
    action: {
      path: '.github/workflows/slsa-provenance.yml',
      label: 'GitHub Actions CI',
      code: `name: Auths SLSA Level 3 Release
on:
  push:
    tags: ['v*']

jobs:
  provenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: auths-dev/action-verify@v1
        with:
          slsa-level: '3'
          output-provenance: 'provenance.slsa.json'`,
    },
    verify: {
      path: 'Zero-CA Release Artifact Verification',
      label: 'Offline Verifier',
      code: `# Verify commit identity & SLSA provenance completely offline
auths verify HEAD

# Verify release bundle artifact
auths verify --artifact release.tar.gz --provenance provenance.slsa.json`,
    },
  };

  const cards = [
    {
      tag: '[HARDWARE-SIGN]',
      title: 'Biometric Secure Enclave',
      desc: 'Signing keys are generated in hardware (macOS Touch ID / TPM 2.0). Keys can never be exported or leaked by malware.',
    },
    {
      tag: '[SLSA-PROVENANCE]',
      title: 'SLSA Level 3 Release Guard',
      desc: 'Automatically generates cryptographically signed in-toto SLSA Level 3 statements for release artifacts.',
    },
    {
      tag: '[ZERO-CA]',
      title: 'Zero-CA Architecture',
      desc: 'No reliance on central Certificate Authorities or third-party web servers. Uses Git commit graph & key event logs.',
    },
    {
      tag: '[OFFLINE-VERIFY]',
      title: 'Offline Browser & CLI Audit',
      desc: 'Verifies release bundles 100% offline using WebAssembly or auths CLI without network calls.',
    },
  ];

  return (
    <div className="my-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="font-mono text-xs font-bold text-seal uppercase tracking-wider mb-2">
          [CONFIGURATION & INTEGRATION]
        </div>
        <h2 className="font-serif text-3xl md:text-4xl text-ink">
          Hardware Commit Signing & SLSA L3
        </h2>
        <p className="mt-3 text-ink-soft text-sm md:text-base">
          Zero-CA software supply chain security. Replace brittle certificate authorities with hardware keys and Git-native provenance.
        </p>
      </div>

      <div className="bg-[#15130f] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs mb-12">
        <div className="bg-[#1c1914] px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="ml-3 text-zinc-500 text-[11px] font-mono">{configs[activeTab].path}</span>
          </div>

          <div className="flex items-center gap-1 bg-[#12100d] p-1 rounded-lg border border-zinc-800 text-[11px]">
            {(Object.keys(configs) as Array<keyof typeof configs>).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  activeTab === key
                    ? 'bg-zinc-800 text-amber-200 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {configs[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 text-amber-100/90 overflow-x-auto">
          <pre><code>{configs[activeTab].code}</code></pre>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div
            key={card.tag}
            className="bg-paper-elevated border border-rule hover:border-seal rounded-xl p-6 transition-all duration-200 shadow-xs hover:shadow-md"
          >
            <div className="font-mono text-xs font-bold text-seal mb-2">{card.tag}</div>
            <h3 className="font-serif text-lg font-semibold text-ink mb-2">{card.title}</h3>
            <p className="text-xs text-ink-soft leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
