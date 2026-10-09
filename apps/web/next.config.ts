import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // monorepo root: two levels up from apps/web
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
