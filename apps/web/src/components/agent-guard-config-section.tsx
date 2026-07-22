'use client';

import { useState } from 'react';

export function AgentGuardConfigSection() {
  const [activeTab, setActiveTab] = useState<'claude' | 'cursor' | 'cli'>('claude');

  const configs = {
    claude: {
      path: '~/Library/Application Support/Claude/claude_desktop_config.json',
      label: 'Claude Desktop',
      code: `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y", "@auths-dev/mcp", "wrap",
        "--scope", "paid.call",
        "--budget", "$50",
        "--ttl", "30m",
        "--", "npx", "-y", "@modelcontextprotocol/server-filesystem", "/workspace"
      ]
    }
  }
}`,
    },
    cursor: {
      path: 'your-project/.cursor/mcp.json',
      label: 'Cursor IDE',
      code: `{
  "mcpServers": {
    "guarded-tool": {
      "command": "npx",
      "args": [
        "-y", "@auths-dev/mcp", "wrap",
        "--scope", "paid.call",
        "--budget", "$50",
        "--ttl", "30m",
        "--", "node", "./server.js"
      ]
    }
  }
}`,
    },
    cli: {
      path: 'Terminal CLI Auto-Discovery',
      label: 'CLI Auto-Discovery',
      code: `# Auto-discover ambient authority & generate pre-bounded mcp.json
npx @auths-dev/mcp init -- npx -y @modelcontextprotocol/server-filesystem /workspace

# Run standalone wrapped gateway
npx @auths-dev/mcp wrap --scope paid.call --budget '$50' --ttl 30m -- node ./server.js`,
    },
  };

  const cards = [
    {
      tag: '[SCOPE]',
      title: 'Capability Scope',
      desc: 'Restricts tool calls to authorized functions (e.g. paid.call or fs.read). Prevents arbitrary command execution.',
    },
    {
      tag: '[BUDGET]',
      title: 'Spend Budget Cap',
      desc: 'Enforces dollar spend caps ($50). Refuses tool invocation at protocol boundary before overspending happens.',
    },
    {
      tag: '[TTL]',
      title: 'Time-to-Live Bound',
      desc: 'Hard time expiration (30m). Automatically invalidates agent session capabilities upon TTL expiration.',
    },
    {
      tag: '[RECEIPT]',
      title: 'Verifiable Spend Receipt',
      desc: 'Emits signed DSSE spend receipts verifiable 100% offline via browser WebAssembly without cloud servers.',
    },
  ];

  return (
    <div className="my-16">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="font-mono text-xs font-bold text-seal uppercase tracking-wider mb-2">
          [CONFIGURATION & BOUNDS]
        </div>
        <h2 className="font-serif text-3xl md:text-4xl text-ink">
          One-Line MCP Client Integration
        </h2>
        <p className="mt-3 text-ink-soft text-sm md:text-base">
          Prepend <code className="font-mono text-seal font-semibold">auths wrap</code> to any existing MCP server line in your client config. No toolchain or central server required.
        </p>
      </div>

      {/* OS Tabbed Window Frame */}
      <div className="bg-[#15130f] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs mb-12">
        {/* Window Bar */}
        <div className="bg-[#1c1914] px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          {/* OS Window Buttons */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="ml-3 text-zinc-500 text-[11px] font-mono">{configs[activeTab].path}</span>
          </div>

          {/* Client Tabs */}
          <div className="flex items-center gap-1 bg-[#12100d] p-1 rounded-lg border border-zinc-800 text-[11px]">
            {(Object.keys(configs) as Array<keyof typeof configs>).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  activeTab === key
                    ? 'bg-zinc-800 text-amber-200 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {configs[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Content */}
        <div className="p-6 text-amber-100/90 overflow-x-auto">
          <pre><code>{configs[activeTab].code}</code></pre>
        </div>
      </div>

      {/* Annotated Parameter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div
            key={card.tag}
            className="bg-paper-elevated border border-rule hover:border-seal rounded-xl p-6 transition-all duration-200 shadow-xs hover:shadow-md"
          >
            <div className="font-mono text-xs font-bold text-seal mb-2">{card.tag}</div>
            <h3 className="font-serif text-lg font-semibold text-ink mb-2">{card.title}</h3>
            <p className="text-xs text-ink-soft leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
