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
  await expect(page.getByRole("tab", { name: /^sign in$/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("tab", { name: /^create account$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^coach demo$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^player demo$/i })).toBeVisible();
  await expect(page.getByText(/mission control/i)).toHaveCount(0);

  const demoContrast = await page.evaluate(() => {
    const parseRgb = (value) => (String(value).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const linearChannel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (rgb) => (0.2126 * linearChannel(rgb[0])) + (0.7152 * linearChannel(rgb[1])) + (0.0722 * linearChannel(rgb[2]));
    const contrast = (foreground, background) => {
      const foregroundLuminance = luminance(parseRgb(foreground));
      const backgroundLuminance = luminance(parseRgb(background));
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const preview = document.querySelector(".auth-demo-enter");
    const buttons = [...(preview?.querySelectorAll("button") || [])];
    const previewColor = getComputedStyle(preview, "::before").color;
    const previewBackground = "rgb(255, 255, 255)";

    return {
      previewColor,
      previewContrast: contrast(previewColor, previewBackground),
      buttons: buttons.map((button) => {
        const style = getComputedStyle(button);
        return {
          label: button.textContent?.trim() || "",
          color: style.color,
          background: style.backgroundColor,
          contrast: contrast(style.color, style.backgroundColor),
        };
      }),
    };
  });

  expect(demoContrast.previewColor).toBe("rgb(68, 81, 91)");
  expect(demoContrast.previewContrast).toBeGreaterThanOrEqual(4.5);
  expect(demoContrast.buttons).toHaveLength(2);
  for (const button of demoContrast.buttons) {
    expect(button.color).toBe("rgb(68, 85, 11)");
    expect(button.background).toBe("rgb(237, 242, 221)");
    expect(button.contrast).toBeGreaterThanOrEqual(4.5);
  }

  await page.screenshot({
    path: path.join(outputDir, "00-auth-welcome.png"),
    fullPage: true,
  });
});
