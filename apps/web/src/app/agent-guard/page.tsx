import type { Metadata } from 'next';
import Link from 'next/link';
import { AgentGuardMotionDiagram } from '@/components/agent-guard-motion-diagram';
import { AgentGuardConfigSection } from '@/components/agent-guard-config-section';

export const metadata: Metadata = {
  title: 'Auths Agent Guard — AI Agent Security & Spend Firewall',
  description: 'Pre-execution budget enforcement, MCP tool sandboxing, and cryptographically verifiable spend receipts.',
};

export default function AgentGuardPage() {
  return (
    <main className="min-h-screen bg-paper text-ink selection:bg-seal/20 pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider font-bold text-seal bg-seal/10 border border-seal/20 rounded-full mb-6">
            [AGENT-GUARD] · MCP FIREWALL
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-normal text-ink tracking-tight leading-tight">
            Auths Agent Guard
          </h1>
          <p className="mt-4 font-mono text-sm text-seal-deep font-medium">
            Pre-Execution Spend Budget Caps & Kernel Capability Sandboxing
          </p>
          <p className="mt-6 text-base md:text-lg text-ink-soft leading-relaxed">
            Pre-execution budget caps, time-to-live bounds, and OS kernel sandboxing for Model Context Protocol (MCP) servers. Refuses overspending before it happens and leaves signed audit receipts.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/docs/agent-guard"
              className="bg-ink hover:bg-seal text-paper px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-md"
            >
              Read Documentation
            </Link>
            <a
              href="https://github.com/auths-dev/auths-mcp"
              target="_blank"
              rel="noreferrer"
              className="bg-paper-elevated border border-rule hover:border-ink-faint text-ink px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* 1. Interactive Protocol Motion Diagram */}
        <AgentGuardMotionDiagram />

        {/* 2. Tabbed Configuration & Annotated Parameter Cards */}
        <AgentGuardConfigSection />
      </div>
    </main>
  );
}
