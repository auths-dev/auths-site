'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

const PRODUCTS = [
  {
    name: 'Auths Agent Guard',
    href: '/agent-guard',
    tagline: 'AI Agent Security & Spend Firewall',
    description: 'Pre-execution budget enforcement, MCP tool scoping, and verifiable spend logs.',
    color: 'from-emerald-500/10 to-emerald-500/5',
  },
  {
    name: 'Auths Supply Chain Shield',
    href: '/supply-chain',
    tagline: 'Zero-CA SLSA Level 3 Release Guard',
    description: 'Hardware-backed developer commit signing (Secure Enclave) and CI/CD verification.',
    color: 'from-blue-500/10 to-blue-500/5',
  },
  {
    name: 'Auths Zero-Trust Developer IAM',
    href: '/iam',
    tagline: 'Biometric Passkey & Presentation Suite',
    description: 'Passwordless presentation challenges for SSH, Kubernetes kubectl, and AWS CLI.',
    color: 'from-purple-500/10 to-purple-500/5',
  },
  {
    name: 'Auths Witness Network',
    href: '/network',
    tagline: 'Decentralized Transparency Quorums',
    description: 'Managed multi-region witness nodes co-signing KEL checkpoints and Merkle inclusion proofs.',
    color: 'from-amber-500/10 to-amber-500/5',
  },
];

export function ProductsDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        className="flex items-center gap-1 py-3 font-mono text-[13px] sm:text-sm text-ink-faint hover:text-ink transition-colors focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>Products</span>
        <svg 
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-seal' : 'text-ink-faint'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[600px] bg-paper-elevated border border-rule shadow-2xl rounded-xl p-4 z-50 grid grid-cols-2 gap-3 opacity-100 backdrop-blur-none bg-[#FBF9F5]"
          >
            {PRODUCTS.map((prod) => (
              <Link
                key={prod.href}
                href={prod.href}
                onClick={() => setIsOpen(false)}
                className={`group p-3 rounded-lg border border-transparent hover:border-rule bg-gradient-to-br ${prod.color} transition-all duration-200 hover:shadow-sm`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-ink group-hover:text-seal transition-colors">
                    {prod.name}
                  </span>
                </div>
                <p className="text-xs font-medium text-ink-soft mb-1">{prod.tagline}</p>
                <p className="text-[11px] text-ink-faint leading-relaxed line-clamp-2">{prod.description}</p>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
