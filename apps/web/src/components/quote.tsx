import type { ReactNode } from 'react';

/**
 * A cited pull-quote for MDX. Renders its own quote marks (real, copy-pasteable
 * characters) inside `not-prose`, so Tailwind Typography's generated blockquote
 * quotes never double up.
 *
 * - `text`  — the quotation (required)
 * - `name`  — the speaker (optional)
 * - `org`   — the organisation (optional)
 * - `link`  — a source URL (optional); links the `org` if present, else the `name`
 */
export function Quote({
  text,
  name,
  org,
  link,
}: {
  text: string;
  name?: string;
  org?: string;
  link?: string;
}) {
  const linkStyle = {
    color: 'inherit',
    borderBottom: '1px solid color-mix(in srgb, var(--seal) 40%, transparent)',
  } as const;
  const asLink = (label: string): ReactNode =>
    link ? (
      <a href={link} target="_blank" rel="noreferrer" style={linkStyle}>
        {label}
      </a>
    ) : (
      label
    );

  // link goes to the org when present, otherwise to the name
  const nameNode: ReactNode | null = name ? (link && !org ? asLink(name) : name) : null;
  const orgNode: ReactNode | null = org ? (link ? asLink(org) : org) : null;
  const bits = [nameNode, orgNode].filter((b): b is ReactNode => b !== null);

  const mark = { color: 'color-mix(in srgb, var(--seal) 70%, transparent)' } as const;

  return (
    <figure className="not-prose my-8">
      <blockquote
        className="pl-5 sm:pl-6"
        style={{ borderLeft: '2px solid color-mix(in srgb, var(--seal) 50%, transparent)' }}
      >
        <p
          className="font-display text-lg italic leading-relaxed"
          style={{ color: 'var(--ink)' }}
        >
          <span style={mark}>“</span>
          {text}
          <span style={mark}>”</span>
        </p>
      </blockquote>
      {bits.length > 0 && (
        <figcaption className="mt-3 pl-5 text-sm sm:pl-6" style={{ color: 'var(--ink-faint)' }}>
          {'— '}
          {bits.map((b, i) => (
            <span key={i}>
              {i > 0 ? ', ' : ''}
              {b}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
