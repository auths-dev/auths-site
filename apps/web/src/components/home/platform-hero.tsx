'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

export function PlatformHero() {
  return (
    <section className="relative pt-28 pb-20 px-6 max-w-6xl mx-auto text-center">
      {/* Editorial Headline */}
      <motion.h1 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="font-serif text-5xl md:text-7xl font-normal tracking-tight text-ink max-w-4xl mx-auto leading-[1.1]"
      >
        Decentralized Cryptography for <span className="italic text-seal">AI Agents</span> & <span className="italic">Software Supply Chains</span>.
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-lg md:text-xl text-ink-soft max-w-2xl mx-auto font-sans leading-relaxed"
      >
        No central authority. No CA. No proprietary cloud dependency. Just Git, WebAssembly, and hardware-backed cryptographic proofs.
      </motion.p>

      {/* Primary Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-10 flex flex-wrap justify-center items-center gap-4"
      >
        <a
          href="https://docs.auths.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-ink hover:bg-seal text-paper px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Get Started in 30 Seconds
        </a>
        <a
          href="https://explorer.auths.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-paper-elevated border border-rule hover:border-ink-faint text-ink px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
        >
          Explore Identity Chains
        </a>
      </motion.div>
    </section>
  );
}
