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

test("diagnose extracted legacy style geometry", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Demo Coach", exact: true }).click();
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });

  const report = await page.evaluate((targets) => {
    const snapshotElement = (element) => {
      if (!element) return null;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        className: element.className,
        hidden: element.hidden,
        ariaHidden: element.getAttribute("aria-hidden"),
        inlineStyle: element.getAttribute("style"),
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
    };
    const ancestry = (element) => {
      const rows = [];
      for (let node = element; node && rows.length < 10; node = node.parentElement) rows.push(snapshotElement(node));
      return rows;
    };
    const matchingDisplayRules = (element) => {
      if (!element) return [];
      const matches = [];
      const visit = (rules, context = "") => {
        for (const rule of [...(rules || [])]) {
          if (rule.cssRules) {
            const nextContext = rule.conditionText || rule.media?.mediaText || context;
            visit(rule.cssRules, nextContext);
            continue;
          }
          if (!rule.selectorText || !rule.style?.display) continue;
          try {
            if (element.matches(rule.selectorText)) matches.push({ selector: rule.selectorText, display: rule.style.display, important: rule.style.getPropertyPriority("display"), context });
          } catch {}
        }
      };
      for (const sheet of [...document.styleSheets]) {
        try { visit(sheet.cssRules); } catch {}
      }
      return matches;
    };
    const styles = [...document.querySelectorAll("style")].map((node, index) => ({
      index,
      length: node.textContent?.length || 0,
      hasDesktopShell: node.textContent?.includes(".app-shell") || false,
      hasShellMain: node.textContent?.includes(".shell-main") || false,
      hasTeamBrandBadgeRule: node.textContent?.includes(".team-brand .chip:not([data-tone])") || false,
    }));
    const elements = Object.fromEntries(targets.map((selector) => [selector, snapshotElement(document.querySelector(selector))]));
    const accountability = document.querySelector('[data-testid="coach-assignment-accountability"]');
    const players = [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === "Players");
    return {
      viewport: { width: innerWidth, height: innerHeight },
      bodyClasses: document.body.className,
      styles,
      elements,
      accountabilityDisplayRules: matchingDisplayRules(accountability),
      accountabilityAncestry: ancestry(accountability),
      accountabilityOuterHtml: accountability?.outerHTML.slice(0, 500) || null,
      playersDisplayRules: matchingDisplayRules(players),
      playersAncestry: ancestry(players),
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
