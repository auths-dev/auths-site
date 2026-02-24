import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Mermaid } from '@/components/mermaid';
import { EcosystemAnimation } from '@/components/ecosystem-animation';

type HeadingProps = ComponentPropsWithoutRef<'h1'>;
type ParagraphProps = ComponentPropsWithoutRef<'p'>;
type CodeProps = ComponentPropsWithoutRef<'code'>;
type PreProps = ComponentPropsWithoutRef<'pre'>;
type AnchorProps = ComponentPropsWithoutRef<'a'>;
type BlockquoteProps = ComponentPropsWithoutRef<'blockquote'>;

/**
 * Extracts the text content and className from a <pre> element's child
 * <code> tag so we can detect language-mermaid blocks.
 */
function getCodeChild(children: ReactNode): { text: string; className?: string } | null {
  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  const props = child.props as { className?: string; children?: ReactNode };
  if (typeof props.children !== 'string') return null;
  return { text: props.children, className: props.className };
}

export const mdxComponents = {
  h1: (props: HeadingProps) => (
    <h1 className="font-mono text-2xl font-bold text-white" {...props} />
  ),
  h2: (props: HeadingProps) => (
    <h2 className="font-mono text-xl font-semibold text-white" {...props} />
  ),
  h3: (props: HeadingProps) => (
    <h3 className="font-mono text-lg font-medium text-zinc-200" {...props} />
  ),
  p: (props: ParagraphProps) => (
    <p className="text-zinc-300" {...props} />
  ),
  code: (props: CodeProps) => (
    <code
      className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-sm text-emerald-300"
      {...props}
    />
  ),
  pre: ({ children, ...rest }: PreProps) => {
    const codeChild = getCodeChild(children);
    if (codeChild?.className?.includes('language-mermaid')) {
      return <Mermaid chart={codeChild.text} />;
    }
    return (
      <pre
        className="overflow-auto rounded-lg bg-zinc-900 p-4 font-mono text-sm text-zinc-200"
        {...rest}
      >
        {children}
      </pre>
    );
  },
  a: (props: AnchorProps) => (
    <a className="text-emerald-400 hover:text-emerald-300 transition-colors" {...props} />
  ),
  blockquote: (props: BlockquoteProps) => (
    <blockquote
      className="border-l-2 border-zinc-700 pl-4 text-zinc-400 italic"
      {...props}
    />
  ),
  EcosystemAnimation,
};
