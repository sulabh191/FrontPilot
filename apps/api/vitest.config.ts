import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Vitest runs the API's unit tests: files named *.spec.ts next to the code they test.
// NestJS 12 ships as ES modules, which Vitest loads natively.
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    environment: "node",
    // Nest's decorators store metadata through this polyfill; load it before any test file.
    setupFiles: ["reflect-metadata"],
    clearMocks: true,
  },
  // Vitest's default compiler (esbuild) can't emit decorator metadata, which Nest's DI
  // needs to know what to inject. SWC can; it reads the decorator settings from tsconfig.json.
  plugins: [swc.vite({ module: { type: "es6" } })],
});
