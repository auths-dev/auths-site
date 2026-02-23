import type { ResolveResult } from './types';

const TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: ResolveResult;
  expires: number;
}

const store = new Map<string, CacheEntry>();

export function cacheGet(key: string): ResolveResult | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet(key: string, data: ResolveResult): void {
  store.set(key, { data, expires: Date.now() + TTL_MS });
}

export function cacheClear(): void {
  store.clear();
}
