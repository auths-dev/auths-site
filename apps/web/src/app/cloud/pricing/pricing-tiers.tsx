'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: '-40px' } as const,
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
});

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

interface Tier {
  name: string;
  price: string;
  period?: string;
  audience: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
  external?: boolean;
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    audience: 'Individual developers',
    features: [
      'Public registry',
      'CLI signing & verification',
      'WASM verification module',
      'Community support',
    ],
    cta: 'Get Started',
    ctaHref: 'https://docs.auths.dev/getting-started/install/',
    external: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: '/user/mo',
    audience: 'Organizations',
    features: [
      'Everything in Free',
      'Organization policies',
      'IdP binding (Okta, Entra ID, Google)',
      'Workload identity for CI/CD',
      'Audit trails & compliance exports',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    ctaHref: 'mailto:sales@auths.dev',
    highlighted: true,
    badge: 'Most Popular',
    external: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    audience: 'Self-hosted & air-gapped',
    features: [
      'Everything in Team',
      'Self-hosted deployment',
      'Air-gapped environment support',
      'Premium support & SLA',
      'Custom integrations',
      'Dedicated onboarding',
    ],
    cta: 'Contact Sales',
    ctaHref: 'mailto:sales@auths.dev',
    external: true,
  },
];

export function PricingTiers() {
  return (
    <section className="relative z-10 px-6 pb-24 pt-32 sm:pt-40">
      <div className="mx-auto max-w-5xl">
        <motion.div {...fadeUp(0)} className="text-center">
          <p className="font-mono text-sm text-emerald-400">Pricing</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
            Start free. Scale with your team. Enterprise when you need it.
          </p>
        </motion.div>

        <motion.div
          className="mt-16 grid gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {TIERS.map((tier) => (
            <motion.div
              key={tier.name}
              variants={staggerItem}
              className={`relative flex flex-col rounded-xl border p-6 ${
                tier.highlighted
                  ? 'border-emerald-500 bg-zinc-900 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                  : 'border-zinc-800 bg-zinc-950/50'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-zinc-950">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-mono text-lg font-semibold text-zinc-100">{tier.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{tier.audience}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-zinc-100">{tier.price}</span>
                {tier.period && (
                  <span className="ml-1 text-sm text-zinc-500">{tier.period}</span>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0 text-emerald-400"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {tier.external ? (
                <a
                  href={tier.ctaHref}
                  className={`mt-auto inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                      : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100'
                  }`}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link
                  href={tier.ctaHref}
                  className={`mt-auto inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                      : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100'
                  }`}
                >
                  {tier.cta}
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
