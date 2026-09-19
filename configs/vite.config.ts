import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
// With the extension: Vite's native config loader (its future default) refuses extensionless
// imports between config files.
import { resolveAppVersion } from "./appVersion.ts";

const rootDir = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  root: rootDir,
  // Relative base: the built app is served from wherever the gh-pages branch is mounted (the custom
  // domain's root today, a PR preview subpath at review time), so asset URLs must not assume the
  // domain root.
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  worker: {
    format: "es",
  },
});
