'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { fetchNetworkStats } from '@/lib/api/registry';
import { registryKeys } from '@/lib/queries/registry';

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      variants={staggerItem}
      className="flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3"
    >
      <span className="font-mono text-2xl font-bold text-zinc-100">
        {value.toLocaleString()}
      </span>
      <span className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </span>
    </motion.div>
  );
}

export function NetworkStatsBar() {
  const { data, isLoading } = useQuery({
    queryKey: registryKeys.networkStats(),
    queryFn: () => fetchNetworkStats(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse flex-col items-center rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3"
          >
            <div className="h-8 w-16 rounded bg-zinc-800" />
            <div className="mt-2 h-3 w-20 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.08 }}
    >
      <StatCard value={data.total_identities} label="Identities" />
      <StatCard value={data.total_attestations} label="Attestations" />
      <StatCard value={data.total_namespaces} label="Namespaces" />
      <StatCard value={data.total_log_entries} label="Log Entries" />
    </motion.div>
  );
}
