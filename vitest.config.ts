import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Integration tests share a single Postgres and reset it in beforeAll;
    // running test files in parallel would let them stomp on each other.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["server/**", "lib/**", "components/**"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "next/cache": fileURLToPath(new URL("./tests/__stubs__/next-cache.ts", import.meta.url)),
    },
  },
});
