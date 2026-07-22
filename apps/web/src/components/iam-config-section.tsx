'use client';

import { useState } from 'react';

export function IamConfigSection() {
  const [activeTab, setActiveTab] = useState<'ssh' | 'k8s' | 'pam'>('ssh');

  const configs = {
    ssh: {
      path: '~/.ssh/config (Passwordless SSH with Auths Presentation)',
      label: 'SSH Config',
      code: `Host production-bastion.internal
  User dev-alice
  IdentityFile none
  # Auths presentation challenge provider
  ProxyCommand auths rp ssh-challenge --host %h --port %p`,
    },
    k8s: {
      path: '~/.kube/config (Kubernetes kubectl Credential Exec Plugin)',
      label: 'Kubectl Exec Plugin',
      code: `users:
- name: alice-biometric-context
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: auths
      args:
        - rp
        - kubectl-token
        - --cluster
        - prod-us-east-1`,
    },
    pam: {
      path: '/etc/pam.d/sshd (Linux C-FFI PAM Module)',
      label: 'Linux PAM Module',
      code: `# /etc/pam.d/sshd
auth required pam_auths.so registry=/etc/auths/registry.json

# Verifies incoming Auths-Presentation headers completely offline`,
    },
  };

  const cards = [
    {
      tag: '[BIOMETRIC-TOUCH]',
      title: 'Hardware Touch ID / Passkey',
      desc: 'Replaces static SSH keys and database passwords with Touch ID, Windows Hello, or YubiKey authentication.',
    },
    {
      tag: '[ISSUERLESS-KERI]',
      title: 'Issuerless Presentations',
      desc: 'Relying party servers verify developer presentation tokens completely offline without contacting identity providers.',
    },
    {
      tag: '[PAM-MODULE]',
      title: 'Native Linux & macOS PAM',
      desc: 'C-FFI pam_auths.so module plugs directly into standard OpenSSH sshd and PAM authentication stacks.',
    },
    {
      tag: '[EXPLICIT-NONCE]',
      title: 'Replay-Proof Nonces',
      desc: 'Single-use cryptographic nonces prevent replay attacks across infrastructure management endpoints.',
    },
  ];

  return (
    <div className="my-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="font-mono text-xs font-bold text-seal uppercase tracking-wider mb-2">
          [CONFIGURATION & INTEGRATION]
        </div>
        <h2 className="font-serif text-3xl md:text-4xl text-ink">
          Passwordless Infrastructure Authentication
        </h2>
        <p className="mt-3 text-ink-soft text-sm md:text-base">
          Biometrically backed presentation authentication for SSH terminals, Kubernetes clusters, and AWS CLI credentials.
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
