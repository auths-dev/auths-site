import type { TrustTier } from '@/lib/api/registry';

export const TIER_STYLES: Record<TrustTier, { color: string; label: string }> = {
  seedling: { color: 'text-zinc-500 border-zinc-700 bg-zinc-900', label: 'Seedling' },
  verified: { color: 'text-blue-400 border-blue-800 bg-blue-950', label: 'Verified' },
  trusted: { color: 'text-emerald-400 border-emerald-800 bg-emerald-950', label: 'Trusted' },
  sovereign: { color: 'text-amber-400 border-amber-800 bg-amber-950', label: 'Sovereign' },
};
