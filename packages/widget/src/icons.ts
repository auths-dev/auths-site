import type { ComponentState } from './types';

/** Inline SVG icons for each component state (16×16 viewBox). */
export const icons: Record<ComponentState, string> = {
  idle: /* gray shield */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1L2 3.5V7.5C2 11.08 4.56 14.38 8 15.25C11.44 14.38 14 11.08 14 7.5V3.5L8 1Z"
            stroke="currentColor" stroke-width="1.2" fill="none"/>
    </svg>`,

  loading: /* pulsing dot */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="4" fill="currentColor" class="auths-pulse"/>
    </svg>`,

  verified: /* shield + checkmark */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1L2 3.5V7.5C2 11.08 4.56 14.38 8 15.25C11.44 14.38 14 11.08 14 7.5V3.5L8 1Z"
            fill="currentColor" opacity="0.15"/>
      <path d="M8 1L2 3.5V7.5C2 11.08 4.56 14.38 8 15.25C11.44 14.38 14 11.08 14 7.5V3.5L8 1Z"
            stroke="currentColor" stroke-width="1.2" fill="none"/>
      <path d="M5.5 8L7.2 9.7L10.5 6.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

  invalid: /* shield + X */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1L2 3.5V7.5C2 11.08 4.56 14.38 8 15.25C11.44 14.38 14 11.08 14 7.5V3.5L8 1Z"
            fill="currentColor" opacity="0.15"/>
      <path d="M8 1L2 3.5V7.5C2 11.08 4.56 14.38 8 15.25C11.44 14.38 14 11.08 14 7.5V3.5L8 1Z"
            stroke="currentColor" stroke-width="1.2" fill="none"/>
      <path d="M6 6L10 10M10 6L6 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,

  expired: /* clock */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.1"/>
      <path d="M8 4.5V8L10.5 9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

  revoked: /* circle + slash */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.1"/>
      <path d="M4.5 11.5L11.5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,

  error: /* warning triangle */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L1.5 13.5H14.5L8 2Z" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.1"
            stroke-linejoin="round"/>
      <path d="M8 6.5V9.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="8" cy="11.5" r="0.7" fill="currentColor"/>
    </svg>`,
};
