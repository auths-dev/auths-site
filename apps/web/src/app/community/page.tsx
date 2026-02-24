import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community',
  description:
    'Join the Auths open-source community building decentralized software identity and supply chain security.',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const SPONSORS = [
  { name: 'KERI Foundation', url: 'https://keri.one' },
  { name: 'WebOfTrust', url: 'https://github.com/WebOfTrust' },
];

const UPDATES = [
  'The Auths CLI now supports signing Docker container images with full KERI identity binding.',
  'Public Registry v1 is live at public.auths.dev — search identities, packages, and repositories.',
  'auths-verifier compiled to WebAssembly enables zero-trust, client-side verification in any browser.',
];

const INITIATIVES = [
  'Multi-party threshold signing for team-managed packages is in active development.',
  'Radicle forge attestation support is landing in the next CLI release.',
  'KERI witness network integration for decentralized key event receipt infrastructure.',
];

const INVOLVEMENT_CARDS = [
  {
    title: 'Join us on GitHub',
    description:
      'Browse the source, open issues, submit pull requests, and help shape the future of decentralized software identity.',
    cta: 'View on GitHub',
    href: 'https://github.com/auths-dev',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    title: 'Share your story',
    description:
      'Already using Auths to secure your supply chain? Share your experience to help us track adoption and improve the tooling.',
    cta: 'Open a discussion',
    href: 'https://github.com/auths-dev/auths/discussions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Attend a community meeting',
    description:
      'We hold open community calls to discuss roadmap priorities, review RFCs, and demo new features. Everyone is welcome.',
    cta: 'Check the calendar',
    href: 'https://github.com/auths-dev/auths/discussions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      {/* ---- Hero ---- */}
      <section className="text-center">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Driven forward by community
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
          As a community, we believe that software identity should be sovereign,
          verifiable, and open. We&rsquo;ve built Auths so that every developer
          can cryptographically prove what they ship&mdash;without relying on
          centralized authorities. Secure software benefits everyone.
        </p>
      </section>

      {/* ---- Sponsors ---- */}
      <section className="mt-16 flex flex-wrap items-center justify-center gap-8">
        {SPONSORS.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--border)] bg-zinc-900/50 px-6 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
          >
            {s.name}
          </a>
        ))}
      </section>

      {/* ---- Divider ---- */}
      <hr className="my-16 border-[var(--border)]" />

      {/* ---- The Auths Story ---- */}
      <section className="grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-mono text-xl font-semibold text-white">
            The Auths story
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-400">
            Auths began with a simple question: why does every software signing
            system require you to trust a centralized authority? Using KERI (Key
            Event Receipt Infrastructure), we built a protocol where your
            identity is a cryptographic log&mdash;not a username on someone
            else&rsquo;s server.
          </p>
          <p className="mt-4 leading-relaxed text-zinc-400">
            Today, Auths is developed by an engaged open-source community
            pursuing a singular goal: making decentralized software identity the
            industry standard. From the CLI that signs your releases, to the
            WebAssembly verifier that runs in any browser, every component is
            designed to be sovereign, portable, and zero-trust by default.
          </p>
        </div>

        <div>
          <h2 className="font-mono text-xl font-semibold text-white">
            Recent updates
          </h2>
          <ul className="mt-4 space-y-4">
            {UPDATES.map((text, i) => (
              <li key={i} className="flex gap-3 text-zinc-400">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Divider ---- */}
      <hr className="my-16 border-[var(--border)]" />

      {/* ---- Initiatives ---- */}
      <section>
        <h2 className="font-mono text-xl font-semibold text-white">
          Initiatives
        </h2>
        <ul className="mt-6 space-y-4">
          {INITIATIVES.map((text, i) => (
            <li key={i} className="flex gap-3 text-zinc-400">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-500" />
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Divider ---- */}
      <hr className="my-16 border-[var(--border)]" />

      {/* ---- Get Involved ---- */}
      <section>
        <h2 className="text-center font-mono text-2xl font-bold text-white">
          Want to get involved?
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {INVOLVEMENT_CARDS.map((card) => (
            <a
              key={card.title}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-[var(--border)] bg-zinc-900/40 p-6 transition-colors hover:border-zinc-600"
            >
              <div className="mb-4 text-zinc-500 transition-colors group-hover:text-emerald-400">
                {card.icon}
              </div>
              <h3 className="font-mono text-base font-semibold text-white">
                {card.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">
                {card.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors group-hover:text-emerald-300">
                {card.cta}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
