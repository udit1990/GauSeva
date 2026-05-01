import { expect, test } from "@playwright/test";

const criticalConsoleMessages = new Set<string>();

test.beforeEach(async ({ page }) => {
  criticalConsoleMessages.clear();

  page.on("pageerror", (error) => {
    criticalConsoleMessages.add(`pageerror:${error.message}`);
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (
      text.includes("Failed to load resource") ||
      text.includes("net::ERR") ||
      text.includes("favicon")
    ) {
      return;
    }
    criticalConsoleMessages.add(`console:${text}`);
  });
});

test.afterEach(async () => {
  expect(
    [...criticalConsoleMessages],
    `Unexpected console/page errors:\n${[...criticalConsoleMessages].join("\n")}`,
  ).toEqual([]);
});

test("home, auth, cart, and checkout render without app crash", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/workers\.dev\/?$/);
  await expect(page.locator("body")).toContainText(/dhyan|seva|gau/i);

  await page.goto("/auth");
  await expect(page.locator("body")).toContainText(/sign|login|phone|password|otp/i);

  await page.goto("/cart");
  await expect(page.locator("body")).toContainText(/cart|daan|seva|empty/i);

  await page.goto("/checkout");
  await expect(page.locator("body")).toContainText(/checkout|name|phone|email|pan|cart/i);
});

test("invalid proof route fails gracefully", async ({ page }) => {
  await page.goto("/proof/test");
  await expect(page.locator("body")).toContainText(/seva not found|back to home/i);
  await expect(page.locator("body")).not.toContainText(/application error|something went wrong/i);
});

test("protected routes gate unauthenticated users", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.locator("body")).toContainText(/sign|login|phone|password|otp/i);

  await page.goto("/volunteer-orders");
  await expect(page.locator("body")).toContainText(/sign|login|phone|password|otp/i);
});
