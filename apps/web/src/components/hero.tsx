'use client';

import { motion } from 'motion/react';
import { AuthsVerifyWidget } from './auths-verify-widget';

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20">
      {/* Headline */}
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Cryptographic Trust,{' '}
          <span className="text-[var(--accent-verified)]">Decentralized.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="mx-auto mt-5 max-w-xl text-base text-[var(--muted)] sm:text-lg"
        >
          Verify software supply chains instantly, without relying on
          centralized identity providers.
        </motion.p>
      </div>

      {/* Terminal demo block */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="mt-12 w-full max-w-2xl"
      >
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted-bg)]">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
          </div>

          {/* Terminal line */}
          <div className="px-5 py-4">
            <p className="font-mono text-sm text-zinc-400">
              <span className="text-[var(--muted)]">~ $</span>{' '}
              <span className="text-white">
                auths verify artifact.tar.gz --signature artifact.sig
              </span>
            </p>
          </div>

          {/* Drop zone */}
          <div className="mx-5 mb-4 flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-zinc-700 px-4 py-5 text-center text-sm text-zinc-500 transition-colors hover:border-zinc-500">
            Drop an artifact here to verify instantly via WebAssembly
          </div>

          {/* Live widget */}
          <div className="px-5 pb-5">
            <AuthsVerifyWidget
              repo="https://github.com/auths-dev/auths"
              mode="detail"
              size="lg"
            />
          </div>
        </div>
      </motion.div>

      {/* Trust logos placeholder */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-12 text-sm text-zinc-600"
      >
        Trusted by{' '}
        <span className="mx-2 inline-block h-5 w-16 rounded bg-zinc-800" />{' '}
        <span className="mx-2 inline-block h-5 w-16 rounded bg-zinc-800" />{' '}
        <span className="mx-2 inline-block h-5 w-16 rounded bg-zinc-800" />{' '}
        — entirely mathematically.
      </motion.p>
    </section>
  );
}
