// playwright.config.js
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 30_000, // per‑test timeout
  retries: 0,
  reporter: [["html", { open: "never" }]], // generates an HTML report
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: "retain-on-failure",
  },
  globalTeardown: "./fixtures.mjs",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
