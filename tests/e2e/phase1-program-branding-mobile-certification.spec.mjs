import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-3a-cross-screen-visual-audit");
const VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 375, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function suppressMotion(page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      caret-color: transparent !important;
    }
    html, body { scrollbar-width: none !important; }
    ::-webkit-scrollbar { display: none !important; }
  ` });
}

async function enterCoachBranding(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await suppressMotion(page);

  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  const brandingItem = sheet.locator('[data-nav-key="branding"]');
  await expect(brandingItem).toBeVisible();
  await brandingItem.click();

  await expect(page.getByTestId("coach-branding-workspace")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Program Branding", exact: true })).toBeVisible();
  await expect(page.locator(".branding-industrial__preview")).toBeVisible();
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(geometry.documentWidth - geometry.viewportWidth).toBeLessThanOrEqual(1);
  expect(geometry.bodyWidth - geometry.viewportWidth).toBeLessThanOrEqual(1);
}

async function expectContained(locator) {
  const geometry = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, viewportWidth: window.innerWidth };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(-0.5);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 0.5);
  expect(geometry.width).toBeGreaterThan(0);
}

async function expectPreviewContrast(page) {
  const result = await page.locator(".branding-industrial__preview").evaluate((preview) => {
    const heading = preview.querySelector(".branding-industrial__panel-header h2");
    const body = preview.querySelector(".branding-industrial__panel-header p");
    const header = preview.querySelector(".branding-industrial__panel-header");

    const parse = (value) => {
      const values = (value.match(/\d+(?:\.\d+)?/g) || []).map(Number);
      return { rgb: values.slice(0, 3), alpha: values.length > 3 ? values[3] : 1 };
    };
    const luminance = (rgb) => {
      const channel = (value) => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
    };
    const contrast = (foreground, background) => {
      const first = luminance(foreground);
      const second = luminance(background);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };

    const previewBackground = parse(getComputedStyle(preview).backgroundColor);
    const fallbackBackground = previewBackground.alpha > 0.01 ? previewBackground.rgb : [10, 38, 51];
    const headingColor = parse(getComputedStyle(heading).color).rgb;
    const bodyColor = parse(getComputedStyle(body).color).rgb;
    const headerBackground = getComputedStyle(header).backgroundColor;

    return {
      headingContrast: contrast(headingColor, fallbackBackground),
      bodyContrast: contrast(bodyColor, fallbackBackground),
      headerBackground,
    };
  });

  expect(result.headingContrast).toBeGreaterThanOrEqual(4.5);
  expect(result.bodyContrast).toBeGreaterThanOrEqual(4.5);
  expect(result.headerBackground).toMatch(/rgba?\(0, 0, 0(?:, 0)?\)|transparent/);
}

async function expectTouchTargets(page) {
  const form = page.locator(".team-branding-form");
  await form.scrollIntoViewIfNeeded();
  await expect(form).toBeVisible();

  const undersized = await form.locator("button, input").evaluateAll((elements) => elements
    .filter((element) => {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.height < 44;
    })
    .map((element) => ({
      tag: element.tagName,
      text: element.textContent?.trim() || element.getAttribute("aria-label") || element.getAttribute("name") || "",
      height: element.getBoundingClientRect().height,
    })));

  expect(undersized).toEqual([]);
}

test("Program Branding is contained, readable, and touch-safe at 320, 375, 390, and 430px", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await enterCoachBranding(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(250);

    await expectNoHorizontalOverflow(page);
    await expectContained(page.getByTestId("coach-branding-workspace"));
    await expectContained(page.locator(".branding-industrial__preview"));
    await expectPreviewContrast(page);
    await expectTouchTargets(page);

    const screenshotPath = path.join(OUTPUT_DIR, `program-branding-${viewport.width}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
    expect(fs.statSync(screenshotPath).size).toBeGreaterThan(20_000);
  }

  expect(pageErrors).toEqual([]);
});