const DOCS_NAV = [
  { label: 'Introduction', href: '/docs/intro' },
  { label: 'How It Works', href: '/docs/how-it-works' },
  { label: 'Getting Started', href: '/docs/getting-started' },
];

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
      <div className="flex gap-12">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-shrink-0 md:block">
          <nav className="sticky top-28 space-y-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Documentation
            </p>
            {DOCS_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="my-4 border-t border-[var(--border)]" />
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Trust & Security
            </p>
            <a
              href="/trust"
              className="block rounded px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              Security Model
            </a>
          </nav>
        </aside>

        {/* Content */}
        <article className="prose max-w-none min-w-0 flex-1">
          {children}
        </article>
      </div>
    </div>
  );
}
