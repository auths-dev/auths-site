import type { SourceConfig, VerifyFn } from './types';
import { githubSource, verifyFromGitHub } from './github';
import { npmSource, verifyFromNpm } from './npm';
import { pypiSource, verifyFromPypi } from './pypi';
import { dockerSource, verifyFromDocker } from './docker';
import { manualSource, verifyManual } from './manual';

export type { Step, VerifyResult, SourceConfig, VerifyFn } from './types';

export const sources: SourceConfig[] = [
  githubSource,
  npmSource,
  pypiSource,
  dockerSource,
  manualSource,
];

export const verifiers: Record<SourceConfig['id'], VerifyFn> = {
  github: verifyFromGitHub,
  npm: verifyFromNpm,
  pypi: verifyFromPypi,
  docker: verifyFromDocker,
  manual: verifyManual,
};
