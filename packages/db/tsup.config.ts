import { defineConfig } from "tsup";

// Compiles the package to JavaScript (ESM + CommonJS) with type definitions,
// so any app (Next.js, NestJS, scripts) can use it like a normal library.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
});
