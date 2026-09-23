import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:4321" },
  webServer: {
    command: "npx astro preview --port 4321",
    url: "http://localhost:4321",
    reuseExistingServer: true,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobiel", use: { ...devices["Pixel 7"] } },
  ],
});
