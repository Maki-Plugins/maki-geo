import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e-tests",
  use: {
    baseURL: "http://localhost:8888",
  },
  webServer: {
    command: "npm run env start",
    port: 8888,
    timeout: 120_000, // 120 seconds.
    reuseExistingServer: true,
  },
});
