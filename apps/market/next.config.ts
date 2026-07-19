import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@auths/ledger-ui"],
  // The Auths SDK is a native napi addon loaded through a bundler-invisible
  // createRequire (see lib/auth/agent-verifier.ts), so Next's file tracing
  // cannot discover it — include it (and its platform binary) explicitly or the
  // deployed functions ship without a verifier and every receipts-worker and
  // agent-auth path fails closed with "verifier unavailable".
  serverExternalPackages: ["@auths-dev/sdk", "@auths-dev/sdk-linux-x64-gnu"],
};

export default nextConfig;
