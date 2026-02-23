import type { SourceConfig, VerifyFn } from './types';

export const npmSource: SourceConfig = {
  id: 'npm',
  label: 'NPM',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z"/></svg>',
  placeholder: '@scope/package',
  enabled: false,
  commandPrefix: 'auths verify --npm',
};

export const verifyFromNpm: VerifyFn = async (_input, onStep) => {
  const step = { type: 'dim' as const, text: 'NPM verification coming soon.' };
  onStep(step);
  return { success: false, steps: [step], error: 'Coming soon' };
};
