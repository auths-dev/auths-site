/**
 * Canonical Auths CLI commands.
 *
 * Keep install strings here so every terminal snippet, onboarding flow,
 * and docs reference stays in sync.
 */

/** Install via Homebrew (macOS). */
export const CLI_INSTALL_BREW = 'brew install auths';

/** Install via shell script (Linux / macOS). */
export const CLI_INSTALL_CURL = 'curl -sSfL https://get.auths.dev | sh';

/** Install via Cargo (any platform with Rust). */
export const CLI_INSTALL_CARGO = 'cargo install auths-cli';

/** Default install shown in hero. */
export const CLI_INSTALL = CLI_INSTALL_BREW;

/** Bootstrap a new identity + configure Git signing. */
export const CLI_INIT = 'auths init';

/** One-command CI setup. */
export const CLI_CI_SETUP = 'auths ci setup';
