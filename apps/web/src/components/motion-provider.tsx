'use client';

import { MotionConfig } from 'motion/react';

/** Honors `prefers-reduced-motion` for every motion component on the site. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
