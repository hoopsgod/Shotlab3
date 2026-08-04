import { test, expect } from "@playwright/test";

const selectors = [
  "body",
  ".app-shell",
  ".sidebar-nav",
  ".shell-main",
  ".content-wrap",
  ".missionControl",
  ".mcHero",
  ".mcHeroContent",
  '[data-testid="coach-command-center-full"]',
  '[data-testid="coach-assignment-accountability"]',
  '[data-testid="coach-live-activity"]',
];

function snapshotElement(element) {
  if (!element) return null;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    tag: element.tagName,
    className: element.className,
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
    position: style.position,
    overflow: style.overflow,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    pointerEvents: style.pointerEvents,
  };
}

test("diagnose extracted legacy style geometry", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Demo Coach", exact: true }).click();
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });

  const report = await page.evaluate((targets) => {
    const styles = [...document.querySelectorAll("style")].map((node, index) => ({
      index,
      length: node.textContent?.length || 0,
      hasDesktopShell: node.textContent?.includes(".app-shell") || false,
      hasShellMain: node.textContent?.includes(".shell-main") || false,
      hasTeamBrandBadgeRule: node.textContent?.includes(".team-brand .chip:not([data-tone])") || false,
    }));
    const elements = Object.fromEntries(targets.map((selector) => [selector, snapshotElement(document.querySelector(selector))]));
    const players = [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === "Players");
    return {
      viewport: { width: innerWidth, height: innerHeight },
      bodyClasses: document.body.className,
      styles,
      elements,
      players: snapshotElement(players),
      elementFromPlayersCenter: players ? (() => {
        const rect = players.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return hit ? { tag: hit.tagName, className: hit.className, text: hit.textContent?.trim().slice(0, 80) } : null;
      })() : null,
    };
  }, selectors);

  console.log(`V9_STYLE_BOUNDARY_REPORT=${JSON.stringify(report)}`);
  expect(report.styles.some((entry) => entry.hasDesktopShell && entry.hasShellMain)).toBe(true);
});
