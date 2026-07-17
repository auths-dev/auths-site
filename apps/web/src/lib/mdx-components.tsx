import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { CodeBlock } from '@auths/ledger-ui';
import { LifelineDiagram } from '@/components/lifeline-diagram/lifeline-diagram';
import { SetupCeremonyDiagram } from '@/components/setup-ceremony-diagram';
import { ApiKeyComparisonDiagram } from '@/components/api-key-comparison-diagram';
import { ThreeLayerDiagram } from '@/components/three-layer-diagram';

type PreProps = ComponentPropsWithoutRef<'pre'>;

/**
 * Extracts the text content and className from a <pre> element's child
 * <code> tag so fenced blocks can be syntax highlighted.
 */
function getCodeChild(children: ReactNode): { text: string; className?: string } | null {
  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  const props = child.props as { className?: string; children?: ReactNode };
  if (typeof props.children !== 'string') return null;
  return { text: props.children, className: props.className };
}

/**
 * Long-form typography defers to the `.prose` ledger styles in globals.css.
 * Only code panes need components: fenced blocks become dark artifacts —
 * the one dark object the paper page allows.
 */
export const mdxComponents = {
  pre: ({ children, ...rest }: PreProps) => {
    const codeChild = getCodeChild(children);
    if (codeChild) {
      const lang = codeChild.className?.replace('language-', '') ?? '';
      return <CodeBlock code={codeChild.text} language={lang} />;
    }
    return <pre {...rest}>{children}</pre>;
  },
  LifelineDiagram,
  SetupCeremonyDiagram,
  ApiKeyComparisonDiagram,
  ThreeLayerDiagram,
};
