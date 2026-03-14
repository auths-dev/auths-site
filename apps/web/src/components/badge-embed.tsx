'use client';

import { REGISTRY_BASE_URL } from '@/lib/config';
import { CopyButton } from '@/components/copy-button';

interface BadgeEmbedProps {
  ecosystem: string;
  packageName: string;
}

export function BadgeEmbed({ ecosystem, packageName }: BadgeEmbedProps) {
  const badgeUrl = `${REGISTRY_BASE_URL}/v1/badges/${encodeURIComponent(ecosystem)}/${encodeURIComponent(packageName)}`;
  const packageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/registry/package/${encodeURIComponent(ecosystem)}/${encodeURIComponent(packageName)}`;

  const markdown = `[![Auths Verified](${badgeUrl})](${packageUrl})`;
  const html = `<a href="${packageUrl}"><img src="${badgeUrl}" alt="Auths Verified" /></a>`;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
      <div className="mb-4 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <h2 className="font-mono text-sm font-semibold text-zinc-200">
          Embed Badge
        </h2>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs text-zinc-500">Preview</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={badgeUrl}
          alt={`Auths verification badge for ${ecosystem}:${packageName}`}
          className="h-5"
        />
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs text-zinc-500">Markdown</p>
            <CopyButton text={markdown} />
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <code className="break-all font-mono text-xs text-zinc-400">{markdown}</code>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs text-zinc-500">HTML</p>
            <CopyButton text={html} />
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <code className="break-all font-mono text-xs text-zinc-400">{html}</code>
          </div>
        </div>
      </div>
    </section>
  );
}
