'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#18181b',
    primaryTextColor: '#fff',
    primaryBorderColor: '#3f3f46',
    lineColor: '#3f3f46',
    secondaryColor: '#0284c7',
    tertiaryColor: '#18181b',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
});

let mermaidIdCounter = 0;

export function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    const id = `mermaid-${++mermaidIdCounter}`;
    let cancelled = false;

    mermaid.render(id, chart).then(({ svg: rendered }) => {
      if (!cancelled) setSvg(rendered);
    });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <div
      ref={containerRef}
      className="my-6 flex justify-center overflow-x-auto rounded-lg bg-zinc-900/50 p-6"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
