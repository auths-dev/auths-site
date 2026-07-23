'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

const PRODUCTS = [
  {
    slug: 'agent-guard',
    title: 'Auths Agent Guard',
    tagline: 'AI Agent Security & Spend Firewall',
    desc: 'Pre-execution budget enforcement, MCP capability sandboxing, and cryptographically signed spend receipts.',
  },
  {
    slug: 'supply-chain',
    title: 'Supply Chain Shield',
    tagline: 'Hardware Commit Signing & SLSA L3',
    desc: 'Biometric Secure Enclave commit signing (P-256) and zero-CA automated CI/CD release verification.',
  },
  {
    slug: 'iam',
    title: 'Zero-Trust Developer IAM',
    tagline: 'Biometric Passkey & Presentation Suite',
    desc: 'Passwordless presentation challenges for SSH terminal logins, Kubernetes kubectl, and AWS CLI.',
  },
  {
    slug: 'network',
    title: 'Witness Network',
    tagline: 'Decentralized Transparency Quorums',
    desc: 'Managed multi-region witness nodes co-signing Key Event Log (KEL) checkpoints and Merkle proofs.',
  },
];

export function ProductMatrix() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-rule">
      <div className="text-center mb-16">
        <h2 className="font-serif text-3xl md:text-4xl text-ink">Products</h2>
        <p className="mt-3 text-ink-soft text-sm md:text-base max-w-xl mx-auto">
          Built on the Auths protocol. Enterprise-ready governance, supply chain security, and zero-trust identity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {PRODUCTS.map((prod, idx) => (
          <motion.div
            key={prod.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group relative bg-paper-elevated border border-rule hover:border-seal rounded-2xl p-8 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between"
          >
            <div>
              <h3 className="font-serif text-2xl text-ink mb-1 group-hover:text-seal transition-colors">
                {prod.title}
              </h3>
              <p className="text-xs font-mono font-medium text-seal-deep mb-4">{prod.tagline}</p>
              <p className="text-sm text-ink-soft leading-relaxed">{prod.desc}</p>
            </div>

            <div className="mt-8 pt-4 border-t border-rule flex items-center justify-between">
              <Link 
                href={`/${prod.slug}`} 
                className="text-xs font-semibold text-ink group-hover:text-seal flex items-center gap-1 transition-colors"
              >
                <span>Learn more</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
