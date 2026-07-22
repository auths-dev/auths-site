import type { Metadata } from 'next';
import Link from 'next/link';

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
          <span className="inline-block p-3 text-4xl rounded-2xl bg-paper-elevated border border-rule shadow-sm mb-6">
            🤖
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-normal text-ink tracking-tight leading-tight">
            Auths Agent Guard
          </h1>
          <p className="mt-4 font-mono text-sm text-seal font-semibold">
            AI Agent Security, MCP Capability Sandboxing & Spend Governance
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

        {/* Quickstart Code Block */}
        <div className="mt-16 bg-[#15130f] border border-zinc-800 rounded-2xl p-6 shadow-2xl font-mono text-xs text-amber-100/90 overflow-x-auto">
          <div className="text-zinc-500 text-[11px] mb-3 pb-2 border-b border-zinc-800 flex justify-between items-center">
            <span>CLAUDE DESKTOP / CURSOR MCP CONFIGURATION</span>
            <span>npx @auths-dev/mcp</span>
          </div>
          <pre><code>{`"filesystem": {
  "command": "npx",
  "args": [
    "-y", "@auths-dev/mcp", "wrap",
    "--scope", "paid.call",
    "--budget", "$50",
    "--ttl", "30m",
    "--", "npx", "-y", "@modelcontextprotocol/server-filesystem", "/workspace"
  ]
}`}</code></pre>
        </div>
      </div>
    </main>
  );
}
