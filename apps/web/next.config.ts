import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["next-mdx-remote", "@auths/ledger-ui"],
  turbopack: {},
  experimental: {
    optimizeCss: true,
  },
  // Unpublished surfaces: the hosted registry is deliberately not sold yet;
  // commit-signing comparisons are not the pitch. (/network is live.)
  async redirects() {
    return [
      { source: "/registry", destination: "/", permanent: false },
      { source: "/registry/:path*", destination: "/", permanent: false },
      { source: "/explorer", destination: "/", permanent: false },
      { source: "/compare", destination: "/", permanent: false },
      { source: "/community", destination: "https://github.com/auths-dev/auths", permanent: false },
      { source: "/docs/:path*", destination: "https://docs.auths.dev/", permanent: false },
    ];
  },
};

export default nextConfig;
