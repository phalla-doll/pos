import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Pure-logic unit tests run in a plain Node environment — the modules under
// test (tab reducer, list-row pipeline, nav consistency) are deliberately
// free of React and the DOM. The `@` alias mirrors tsconfig's paths.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
})
