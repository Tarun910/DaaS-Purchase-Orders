import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Avoid generating AGENTS.md / CLAUDE.md in the repo root during next dev
  experimental: {},
};

export default nextConfig;
