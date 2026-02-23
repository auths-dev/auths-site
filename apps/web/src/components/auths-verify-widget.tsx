'use client';

import Script from 'next/script';

interface AuthsVerifyWidgetProps {
  repo?: string;
  mode?: 'badge' | 'detail' | 'tooltip';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AuthsVerifyWidget({
  repo,
  mode = 'detail',
  size = 'lg',
  className,
}: AuthsVerifyWidgetProps) {
  return (
    <div className={className}>
      <Script src="/auths-verify.js" strategy="lazyOnload" />
      {/* @ts-expect-error — custom element registered at runtime */}
      <auths-verify repo={repo} mode={mode} size={size} />
    </div>
  );
}
