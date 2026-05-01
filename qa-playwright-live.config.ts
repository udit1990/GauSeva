import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./qa",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "https://gauseva.udit1990.workers.dev",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
