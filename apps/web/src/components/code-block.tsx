'use client';

import { Highlight, themes } from 'prism-react-renderer';

export function CodeBlock({ code, language, className }: { code: string; language: string; className?: string }) {
  return (
    <Highlight theme={themes.oneDark} code={code.trimEnd()} language={language}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className={className ?? "overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-900/80 p-4 font-mono text-sm leading-relaxed"}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
