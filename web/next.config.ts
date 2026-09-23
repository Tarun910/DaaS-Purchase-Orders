import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @ts-expect-error Next 16 agentRules is supported at runtime
  agentRules: false,
};

export default nextConfig;
