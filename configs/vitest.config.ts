import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolveAppVersion } from "./appVersion.ts";

const rootDir = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  root: rootDir,
  // Same injection vite.config.ts performs, so src/main.ts (which reads __APP_VERSION__) can be
  // imported by the boot smoke tests.
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
  },
  test: {
    // Pure-logic suites run under node; a suite that needs a DOM opts in with a
    // `// @vitest-environment jsdom` docblock on its first line.
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // Vitest 5 clears mocks before each test by default. The boot suites here import the app once
    // in `beforeAll` and assert on what it did across multiple `it` blocks, so restore the pre-v5
    // behavior of leaving mocks alone between tests.
    clearMocks: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["**/*.d.ts", "**/*.test.ts", "**/*.spec.ts", "stories/**", "tests/**", "configs/**"],
      reporter: ["text", "lcov", "json"],
      // Ratchet thresholds: set just below the current measured coverage so any regression fails
      // locally (and in CI) before the Codecov upload. Raise these as coverage improves; they are
      // not a target, only a floor.
      thresholds: {
        statements: 98,
        branches: 92,
        functions: 99,
        lines: 99,
      },
    },
  },
});
