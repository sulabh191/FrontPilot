import type { NextConfig } from "next";
import path from "path";
const nextConfig: NextConfig = {
  /* config options here */
    turbopack: {
    // monorepo root: two levels up from apps/web
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
