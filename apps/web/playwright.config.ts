import { defineConfig, devices } from "@playwright/test"

const mockAuth = !process.env.E2E_USER_EMAIL

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: mockAuth
    ? [
        {
          name: "chromium",
          use: { ...devices["Desktop Chromium"] },
        },
      ]
    : [
        {
          name: "auth-setup",
          testMatch: /auth\.setup\.ts/,
        },
        {
          name: "chromium",
          use: {
            ...devices["Desktop Chromium"],
            storageState: "e2e/.auth/user.json",
          },
          dependencies: ["auth-setup"],
        },
      ],
  webServer: {
    command: process.env.CI ? "pnpm --filter web build && pnpm --filter web preview" : "pnpm dev",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...(mockAuth ? { VITE_ENABLE_MOCK_AUTH: "true" } : {}),
    },
  },
})
