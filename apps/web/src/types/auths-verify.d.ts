// TypeScript declarations for the <auths-verify> custom element
declare namespace JSX {
  interface IntrinsicElements {
    'auths-verify': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        repo?: string;
        forge?: string;
        identity?: string;
        attestation?: string;
        attestations?: string;
        'public-key'?: string;
        mode?: 'badge' | 'detail' | 'tooltip';
        size?: 'sm' | 'md' | 'lg';
      },
      HTMLElement
    >;
  }
}
