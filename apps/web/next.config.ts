import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["next-mdx-remote"],
  turbopack: {},
  experimental: {
    optimizeCss: true,
  },
  // Unpublished surfaces: the witness network and the hosted registry are
  // deliberately not sold yet; commit-signing comparisons are not the pitch.
  async redirects() {
    return [
      { source: "/network", destination: "/", permanent: false },
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
