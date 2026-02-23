import type { SourceConfig, VerifyFn } from './types';
import { githubSource, verifyFromGitHub } from './github';
import { npmSource, verifyFromNpm } from './npm';
import { dockerSource, verifyFromDocker } from './docker';
import { manualSource, verifyManual } from './manual';

export type { Step, VerifyResult, SourceConfig, VerifyFn } from './types';

export const sources: SourceConfig[] = [
  githubSource,
  npmSource,
  dockerSource,
  manualSource,
];

export const verifiers: Record<SourceConfig['id'], VerifyFn> = {
  github: verifyFromGitHub,
  npm: verifyFromNpm,
  docker: verifyFromDocker,
  manual: verifyManual,
};
