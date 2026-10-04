import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source; let Next.js compile them.
  transpilePackages: ["@frontpilot/db"],
  turbopack: {
    // monorepo root: two levels up from apps/web
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
