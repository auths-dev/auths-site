import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@auths/ledger-ui", "@auths/witnesses"],
  // The Auths SDK is a native napi addon loaded through a bundler-invisible
  // getBuiltinModule/createRequire (see lib/transport/sdk.ts), so Next's file
  // tracing cannot discover it — include it (and its platform binary) explicitly
  // or the deployed route handlers ship without the registry transport and the
  // server KEL-read path fails closed.
  serverExternalPackages: ["@auths-dev/sdk", "@auths-dev/sdk-linux-x64-gnu"],
  outputFileTracingIncludes: {
    "/**": ["./vendor/auths-sdk/**"],
  },
  // The browser verifier is wasm-bindgen `--target web` output: the glue and the
  // `.wasm` binary are co-located in src/lib/verify/wasm, so Turbopack emits the
  // binary as a hashed static asset via the glue's `new URL(..., import.meta.url)`
  // and `init()` fetches it. No custom WASM/webpack config needed.
};

export default nextConfig;
