import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cartographer/core", "@cartographer/data", "@cartographer/schemas"],
};

export default nextConfig;
