'use client';

import './prism-global';
import 'prismjs/components/prism-bash';
import { Highlight, themes } from 'prism-react-renderer';

/**
 * Bash lines for INSIDE an InkTerminal: the same prism theme as CodeBlock but
 * transparent (the terminal owns the dark frame), with the `$ ` gutter on each
 * command start, two-space alignment on `\` continuation lines, and comments
 * left to the theme. Pass the exact text a visitor would paste.
 */
export function BashLines({ code }: { code: string }) {
  return (
    <Highlight theme={themes.gruvboxMaterialDark} code={code.trimEnd()} language="bash">
      {({ tokens, getLineProps, getTokenProps }) => {
        let continuation = false;
        return (
          <div className="overflow-x-auto">
            {tokens.map((line, i) => {
              const text = line.map((t) => t.content).join('');
              const trimmed = text.trim();
              const isComment = trimmed.startsWith('#');
              const isCommandStart = trimmed !== '' && !isComment && !continuation;
              const isContinuation = trimmed !== '' && !isComment && continuation;
              const lineProps = getLineProps({ line });
              const rendered = (
                <p key={i} {...lineProps} className="break-all">
                  {isCommandStart ? (
                    <span className="select-none text-[#9a948c]">$ </span>
                  ) : null}
                  {isContinuation ? <span className="select-none">{'  '}</span> : null}
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </p>
              );
              continuation = !isComment && trimmed.endsWith('\\');
              return rendered;
            })}
          </div>
        );
      }}
    </Highlight>
  );
}

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
