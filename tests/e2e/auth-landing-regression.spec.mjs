import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/app-store/iphone-6.9");

test("normal launch clears stale demo authentication and renders the full welcome screen", async ({ page }) => {
  fs.mkdirSync(outputDir, { recursive: true });

  await page.addInitScript(() => {
    const staleDemoSession = JSON.stringify({ email: "coach.demo@shotlab.app" });
    const staleSupabaseSession = JSON.stringify({
      currentSession: {
        user: { email: "coach.demo@shotlab.app" },
        access_token: "stale-demo-token",
      },
    });

    window.localStorage.setItem("sl:demoMode", "true");
    window.localStorage.setItem("sl:session", staleDemoSession);
    window.sessionStorage.setItem("sl:demoSession", "true");
    window.localStorage.setItem("sb-test-auth-token", staleSupabaseSession);
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page).not.toHaveURL(/demo=1/);
  await expect(page.getByRole("button", { name: /^sign in$/i }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("tab", { name: /^create account$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^coach demo$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^player demo$/i })).toBeVisible();
  await expect(page.getByText(/mission control/i)).toHaveCount(0);

  await page.screenshot({
    path: path.join(outputDir, "00-auth-welcome.png"),
    fullPage: true,
  });
});
