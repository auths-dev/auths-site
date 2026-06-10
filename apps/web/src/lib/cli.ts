/**
 * Canonical Auths CLI commands.
 *
 * Keep install strings here so every terminal snippet, onboarding flow,
 * and docs reference stays in sync.
 */

/** Install via Homebrew (macOS) — user/repo/formula form taps automatically. */
export const CLI_INSTALL_BREW = 'brew install auths-dev/auths-cli/auths';

/** Install via shell script (Linux / macOS). */
export const CLI_INSTALL_CURL = 'curl -fsSL https://get.auths.dev | sh';

/** Install via Cargo (any platform with Rust). */
export const CLI_INSTALL_CARGO = 'cargo install auths-cli';

/** Default install shown in hero. */
export const CLI_INSTALL = CLI_INSTALL_BREW;

/** Bootstrap a new identity + configure Git signing. */
export const CLI_INIT = 'auths init';

/** Sign + verify a throwaway artifact offline — the 30-second demo. */
export const CLI_DEMO = 'auths demo';

/** Headless CI identity setup. */
export const CLI_CI_SETUP = 'auths init --profile ci --non-interactive';
