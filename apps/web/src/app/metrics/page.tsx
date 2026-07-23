import type { Metadata } from 'next';
import { EnterpriseGrafanaDashboard } from '@/components/enterprise-grafana-dashboard';

export const metadata: Metadata = {
  title: 'Auths Enterprise Grafana Dashboard — Real-Time Prometheus Metrics',
  description: 'Live Grafana Prometheus dashboard for Auths Agent Guard, Touch ID biometrics, and Witness Network quorums.',
};

export default function MetricsPage() {
  return (
    <main className="min-h-screen bg-[#0b0c0e] text-slate-100 selection:bg-amber-500/20 pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <div className="inline-block px-3 py-1 font-mono text-[11px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3">
            [ENTERPRISE OBSERVED] · PROMETHEUS METRICS & GRAFANA
          </div>
          <h1 className="font-sans text-3xl md:text-5xl font-bold text-white tracking-tight">
            Auths Enterprise Observability
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time Grafana dashboard polling scrapable Prometheus metrics from <code className="text-cyan-400 bg-[#181b1f] px-1.5 py-0.5 rounded border border-[#22252b]">http://localhost:9090/metrics</code>.
          </p>
        </div>

        {/* Live Grafana Dashboard Component */}
        <EnterpriseGrafanaDashboard />
      </div>
    </main>
  );
}
