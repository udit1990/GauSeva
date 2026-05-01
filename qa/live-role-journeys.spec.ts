import path from "node:path";
import { expect, test } from "@playwright/test";

const SUPABASE_URL = "https://crjuqtdautajzdireelp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyanVxdGRhdXRhanpkaXJlZWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NzM4NzUsImV4cCI6MjA5MzE0OTg3NX0.8YAc8OzRIPfSeG0dCKcLgOZz8hT4aQJ3Ao94Ll_yvSI";
const STORAGE_KEY = "sb-crjuqtdautajzdireelp-auth-token";
const TEST_IMAGE = path.resolve(process.cwd(), "public/pwa-icon-512.png");

async function signInSession(
  request: Parameters<typeof test>[0]["request"],
  email: string,
  password: string,
) {
  const response = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    data: { email, password },
  });

  expect(response.ok(), `Auth failed for ${email}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function applySession(
  page: Parameters<typeof test>[0]["page"],
  session: Record<string, unknown>,
) {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: STORAGE_KEY, value: session },
  );
}

test.describe.serial("live admin and volunteer MVP role journeys", () => {
  test("admin can access key MVP admin surfaces and see seeded data", async ({ page, request }) => {
    const session = await signInSession(request, "admin@test.com", "Admin@123");
    await applySession(page, session);

    await page.goto("/admin");
    await expect(page.locator("body")).toContainText("Admin");
    await expect(page.locator("body")).toContainText("Overview");
    await expect(page.locator("body")).toContainText("Orders");
    await expect(page.locator("body")).toContainText("People");
    await expect(page.locator("body")).toContainText("Settings");

    await page.getByRole("button", { name: "Orders" }).click();
    await expect(page.locator("body")).toContainText("Test Donor");
    await expect(page.locator("body")).toContainText("Dhyan Test Gaushala");

    await page.getByRole("button", { name: "People" }).click();
    await page.getByRole("button", { name: "Volunteers" }).click();
    await expect(page.locator("body")).toContainText("Test Volunteer");
    await expect(page.locator("body")).toContainText("Tagged Gaushala");
    await expect(page.locator("body")).toContainText("Dhyan Test Gaushala");

    await page.getByRole("button", { name: "Settings" }).click();
    await expect(page.locator("body")).toContainText("Auto-Assign Volunteers");
    await expect(page.locator("body")).toContainText("Auto-Approve Basic Evidence");
  });

  test("volunteer can see task, upload evidence, and complete the task", async ({ page, request }) => {
    const session = await signInSession(request, "volunteer@test.com", "Volunteer@123");
    await applySession(page, session);

    await page.goto("/");
    await expect(page.locator("body")).toContainText("Welcome back");
    await expect(page.locator("body")).toContainText("Dhyan Test Gaushala");

    await page.goto("/volunteer-tasks");
    await expect(page.locator("body")).toContainText("Tasks");
    await expect(page.locator("body")).toContainText("Test Donor");

    await page.getByText("Test Donor").click();
    await expect(page.locator("body")).toContainText("Task Details");
    await expect(page.locator("body")).toContainText("Dhyan Test Gaushala");

    await page.getByPlaceholder("Caption (optional)").fill("QA proof upload");
    await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);

    await expect(page.locator("body")).toContainText(/approved|validated|pending/i, {
      timeout: 20_000,
    });

    await page.getByPlaceholder("Add notes about this task...").fill("Completed during live MVP QA.");
    await page.getByRole("button", { name: /Complete Task/i }).click();

    await expect(page).toHaveURL(/\/volunteer-tasks$/);
    await expect(page.locator("body")).toContainText("Test Donor");

    await page.goto("/volunteer-profile");
    await expect(page.locator("body")).toContainText("Profile");
    await expect(page.locator("body")).toContainText("Dhyan Test Gaushala");

    await page.goto("/volunteer-uploads");
    await expect(page.locator("body")).toContainText(/All uploads synced|pending upload/i);
  });

  test("admin can verify the post-fulfillment state after volunteer completion", async ({ page, request }) => {
    const session = await signInSession(request, "admin@test.com", "Admin@123");
    await applySession(page, session);

    await page.goto("/admin?tab=orders");
    await expect(page.locator("body")).toContainText("Test Donor");
    await expect(page.locator("body")).toContainText(/completed|paid/i);

    await page.getByText("Test Donor").click();
    await expect(page.locator("body")).toContainText("Green Fodder Bundle");
    await expect(page.locator("body")).toContainText("Dhyan Test Gaushala");
  });
});
