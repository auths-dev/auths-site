import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["next-mdx-remote"],
  turbopack: {},
};

export default nextConfig;
