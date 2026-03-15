import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["next-mdx-remote"],
  turbopack: {},
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
