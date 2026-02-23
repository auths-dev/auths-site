/** A single log step emitted during verification */
export type Step = {
  type: 'info' | 'hash' | 'ok' | 'err' | 'dim';
  text: string;
};

/** Final result of a verification flow */
export type VerifyResult = {
  success: boolean;
  steps: Step[];
  error?: string;
};

/** Input config per source type */
export type SourceConfig = {
  id: 'github' | 'npm' | 'docker' | 'manual';
  label: string;
  icon: string;
  placeholder: string;
  enabled: boolean;
  commandPrefix: string;
};

/** The port — every adapter implements this */
export type VerifyFn = (
  input: string,
  onStep: (step: Step) => void,
  extra?: { fileHash?: string },
) => Promise<VerifyResult>;
