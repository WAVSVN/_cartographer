import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cartographer/core", "@cartographer/data", "@cartographer/schemas"],
  // Include fixture JSON in serverless traces (read at runtime by @cartographer/data)
  outputFileTracingIncludes: {
    "/api/**/*": ["../../packages/data/fixtures/**/*"],
  },
};

export default nextConfig;
