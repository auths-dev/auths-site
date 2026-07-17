'use client';

import { Highlight, themes } from 'prism-react-renderer';

/**
 * Syntax-highlighted code pane in the ledger's artifact frame — dark ink
 * on #15130f, the only dark object the paper page allows.
 */
export function CodeBlock({
  code,
  language,
  className,
}: {
  code: string;
  language: string;
  className?: string;
}) {
  return (
    <Highlight theme={themes.gruvboxMaterialDark} code={code.trimEnd()} language={language}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre
          className={
            className ??
            'overflow-x-auto rounded-lg bg-[#15130f] p-4 font-mono text-sm leading-relaxed shadow-[0_24px_60px_-12px_rgba(28,24,20,0.45)] ring-1 ring-black/20'
          }
        >
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
