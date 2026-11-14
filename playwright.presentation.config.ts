import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/presentation",
  outputDir: ".presentation-demo/test-results",
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4322",
    channel: "msedge",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://127.0.0.1:4322/auth/signin",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
