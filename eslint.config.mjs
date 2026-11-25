import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Restore the missing flat configuration without disabling application rules.
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "playwright-report/**", "test-results/**", "next-env.d.ts", "public/offline-assets/**", "public/suntech-sw.js", "public/sw.js", "public/workbox-*.js", "public/swe-worker*"]),
]);
