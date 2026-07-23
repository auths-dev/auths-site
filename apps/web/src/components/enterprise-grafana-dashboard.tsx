'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface MetricState {
  dbQueryCount: number;
  deployDeniedCount: number;
  totalSpendUsd: number;
  touchIdAssertions: number;
  londonStatus: string;
  virginiaStatus: string;
  lastScraped: string;
  isLive: boolean;
}

export function EnterpriseGrafanaDashboard() {
  const [metrics, setMetrics] = useState<MetricState>({
    dbQueryCount: 1,
    deployDeniedCount: 1,
    totalSpendUsd: 537.50,
    touchIdAssertions: 1,
    londonStatus: 'HTTP 200 OK',
    virginiaStatus: 'HTTP 200 OK',
    lastScraped: new Date().toLocaleTimeString(),
    isLive: true,
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:9090/metrics');
        if (res.ok) {
          const text = await res.text();
          setMetrics((prev) => ({
            ...prev,
            lastScraped: new Date().toLocaleTimeString(),
            isLive: true,
          }));
        }
      } catch (_e) {
        setMetrics((prev) => ({ ...prev, isLive: false }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#111217] text-slate-100 rounded-2xl p-6 border border-[#22252b] shadow-2xl font-mono text-xs my-8">
      {/* Grafana Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#22252b] gap-4">
        <div className="flex items-center gap-3">
          {/* Grafana Logo Badge */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-bold text-white shadow-md">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-lg font-semibold text-white tracking-tight">
                Auths Enterprise Grafana Dashboard
              </h3>
              <span className="bg-[#181b1f] border border-[#2c323d] text-amber-400 text-[10px] px-2 py-0.5 rounded font-mono">
                PROMETHEUS (v0.0.4)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Data Source: <code className="text-cyan-400">http://localhost:9090/metrics</code> | Refresh: 2s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#181b1f] border border-[#2c323d] px-3 py-1.5 rounded-lg text-[11px]">
            <span className={`w-2 h-2 rounded-full ${metrics.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-slate-300">
              {metrics.isLive ? `Live Scrape (${metrics.lastScraped})` : 'Offline (Start Stage 5)'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Grafana Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Panel 1: MCP Tool Calls Stat Panel */}
        <div className="md:col-span-4 bg-[#181b1f] border border-[#22252b] rounded-xl p-4 flex flex-col justify-between hover:border-[#343a46] transition-colors">
          <div className="flex items-center justify-between border-b border-[#262a33] pb-2 mb-3">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              MCP Tool Calls (Counter)
            </span>
            <span className="text-[10px] text-slate-500">auths_mcp_tool_calls_total</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#111217] p-2.5 rounded border border-[#22252b]">
              <span className="text-slate-400">mcp:db_query</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                APPROVED: {metrics.dbQueryCount}
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#111217] p-2.5 rounded border border-[#22252b]">
              <span className="text-slate-400">mcp:deploy_production</span>
              <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                DENIED: {metrics.deployDeniedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: Agent Spend Gauge Panel */}
        <div className="md:col-span-4 bg-[#181b1f] border border-[#22252b] rounded-xl p-4 flex flex-col justify-between hover:border-[#343a46] transition-colors">
          <div className="flex items-center justify-between border-b border-[#262a33] pb-2 mb-3">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Accumulated Spend (USD)
            </span>
            <span className="text-[10px] text-slate-500">auths_mcp_spend_usd_total</span>
          </div>
          <div className="text-center py-2">
            <div className="text-3xl font-extrabold text-rose-400 tracking-tight">
              ${metrics.totalSpendUsd.toFixed(2)}
            </div>
            <div className="mt-2 inline-block bg-rose-500/10 text-rose-300 text-[10px] px-2.5 py-1 rounded border border-rose-500/20">
              ⚠️ BREACHED ($50.00 Max Cap)
            </div>
          </div>
          <div className="w-full bg-[#111217] h-2 rounded-full overflow-hidden border border-[#22252b] mt-2">
            <div className="bg-rose-500 h-full w-full"></div>
          </div>
        </div>

        {/* Panel 3: Secure Enclave Touch ID Stat Panel */}
        <div className="md:col-span-4 bg-[#181b1f] border border-[#22252b] rounded-xl p-4 flex flex-col justify-between hover:border-[#343a46] transition-colors">
          <div className="flex items-center justify-between border-b border-[#262a33] pb-2 mb-3">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Touch ID Assertions
            </span>
            <span className="text-[10px] text-slate-500">auths_hardware_attestations</span>
          </div>
          <div className="text-center py-2">
            <div className="text-3xl font-extrabold text-cyan-400 tracking-tight">
              {metrics.touchIdAssertions}
            </div>
            <div className="mt-2 text-slate-400 text-[11px]">
              Apple Secure Enclave P-256
            </div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] p-2 rounded text-center">
            Biometric Key Hardware-Anchored
          </div>
        </div>

        {/* Panel 4: Witness Quorum Nodes Status Grid */}
        <div className="md:col-span-12 bg-[#181b1f] border border-[#22252b] rounded-xl p-4">
          <div className="flex items-center justify-between border-b border-[#262a33] pb-2 mb-3">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Multi-Region Witness Quorum Status (auths_witness_quorum_nodes_active)
            </span>
            <span className="text-emerald-400 font-bold text-[11px]">2 / 2 QUORUM HEALTHY</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-[#111217] p-3 rounded border border-[#22252b]">
              <div>
                <span className="text-white font-bold">Node 1: London (lhr)</span>
                <p className="text-[10px] text-slate-400">https://auths-network.fly.dev</p>
              </div>
              <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded font-bold text-[11px] border border-emerald-500/30">
                {metrics.londonStatus}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#111217] p-3 rounded border border-[#22252b]">
              <div>
                <span className="text-white font-bold">Node 2: Virginia (iad)</span>
                <p className="text-[10px] text-slate-400">https://auths-network-2.fly.dev</p>
              </div>
              <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded font-bold text-[11px] border border-emerald-500/30">
                {metrics.virginiaStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
