import { defineConfig } from "tsup";

// Compiles the package to JavaScript (ESM + CommonJS) with type definitions,
// so any app (Next.js, NestJS, scripts) can use it like a normal library.
export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  // Clean only for real builds. In watch mode, deleting dist/ would leave other
  // apps without type definitions for the second it takes to regenerate them.
  clean: !options.watch,
}));
