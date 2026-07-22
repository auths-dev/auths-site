'use client';

import { useState } from 'react';

export function NetworkConfigSection() {
  const [activeTab, setActiveTab] = useState<'node' | 'api' | 'wasm'>('node');

  const configs = {
    node: {
      path: 'auths-witness-node (Rust Witness Server Entrypoint)',
      label: 'Witness Node CLI',
      code: `# Start a local witness node co-signing KEL checkpoints
auths-witness-node --bind 0.0.0.0:3331 --hsm-kms-arn arn:aws:kms:us-east-1:123456789:key/wit-1

# Witness node continuously co-signs KEL events & spend checkpoints`,
    },
    api: {
      path: 'GET /api/spend-checkpoint (REST API Proof Endpoint)',
      label: 'REST Proof API',
      code: `// Fetch spend inclusion proof from witness node
GET /api/spend-checkpoint?agent_did=did:key:z6MkpTHR...

Response (200 OK):
{
  "checkpoint_seq": 42,
  "witness_signatures": ["did:key:zWit1...", "did:key:zWit2..."],
  "merkle_root": "0x8f3c...2a"
}`,
    },
    wasm: {
      path: '<auths-verify mode="badge"> (In-Browser WASM Proof Element)',
      label: 'WASM Verifier Widget',
      code: `<!-- Drop live WASM verifier widget into any HTML page -->
<script type="module" src="https://auths.dev/auths-verify.js"></script>

<auths-verify 
  attestation='{"kel_seq": 42, ...}' 
  public-key="did:key:zWit1..." 
  mode="detail" 
/>`,
    },
  };

  const cards = [
    {
      tag: '[QUORUM-GOSSIP]',
      title: 'Decentralized Quorum Co-Signing',
      desc: 'Independent witness nodes across AWS, GCP, and bare-metal servers co-sign KEL checkpoints to prevent key history tampering.',
    },
    {
      tag: '[MERKLE-PROOF]',
      title: 'Append-Only Merkle Trees',
      desc: 'Stores key event checkpoints in append-only Merkle transparency trees with cryptographic inclusion proofs.',
    },
    {
      tag: '[DUAL-KEY]',
      title: 'HSM Hardware Key Storage',
      desc: 'Witness node signing keys are secured inside Cloud KMS / HSM modules with zero private key extraction.',
    },
    {
      tag: '[WASM-AUDIT]',
      title: 'Browser WASM Explorer',
      desc: 'Browser client re-verifies witness quorum signatures offline using WebAssembly before establishing trust.',
    },
  ];

  return (
    <div className="my-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="font-mono text-xs font-bold text-seal uppercase tracking-wider mb-2">
          [CONFIGURATION & INTEGRATION]
        </div>
        <h2 className="font-serif text-3xl md:text-4xl text-ink">
          Decentralized Witness Transparency Infrastructure
        </h2>
        <p className="mt-3 text-ink-soft text-sm md:text-base">
          Managed multi-region witness nodes co-signing Key Event Log (KEL) sequence checkpoints and Merkle inclusion proofs.
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
