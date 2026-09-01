import { expect } from "@playwright/test";

export const MOBILE_GEOMETRY_WIDTHS = [
  { width: 320, height: 740 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

export const MOBILE_GEOMETRY_TOLERANCE = 1;

// The Coach Players filter-chip row is intentionally swipeable because its five
// named filters do not fit at the supported mobile widths. It is the only
// product surface authorized to own horizontal scrolling in Phase 1A.
export const INTENTIONAL_HORIZONTAL_SCROLL_ALLOWLIST = [{
  selector: '[aria-label="Dashboard view filters"]',
  component: "Coach Players dashboard filters",
  rationale: "Keeps every named roster filter reachable without widening the page.",
}];

async function waitForRequiredGeometryTargets(page, contract, label) {
  for (const [name, selector] of Object.entries(contract.targets || {})) {
    await expect(
      page.locator(selector).first(),
      `${label} geometry target "${name}" did not become visible: ${selector}`,
    ).toBeVisible({ timeout: 10_000 });
  }
}

export async function collectMobileGeometry(page, contract) {
  return page.evaluate(async ({ contract, allowlist }) => {
    const tolerance = 1;
    const layoutWidth = document.documentElement.clientWidth;
    const visualLeft = window.visualViewport?.offsetLeft ?? 0;
    const visualWidth = window.visualViewport?.width ?? layoutWidth;
    const visualRight = visualLeft + visualWidth;
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    const labelFor = (node) => {
      const testId = node.getAttribute("data-testid");
      if (testId) return `[data-testid="${testId}"]`;
      const id = node.id ? `#${node.id}` : "";
      const classes = [...node.classList].slice(0, 3).map((name) => `.${name}`).join("");
      return `${node.tagName.toLowerCase()}${id}${classes}`;
    };
    const describe = (selector) => {
      const node = document.querySelector(selector);
      if (!node || !visible(node)) return null;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        selector,
        label: labelFor(node),
        left: rect.left,
        right: rect.right,
        width: rect.width,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        scrollLeft: node.scrollLeft,
        overflowX: style.overflowX,
        minWidth: style.minWidth,
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns,
        flex: style.flex,
        boxSizing: style.boxSizing,
      };
    };
    const targets = Object.fromEntries(Object.entries(contract.targets).map(([name, selector]) => [name, describe(selector)]));
    const centered = Object.fromEntries((contract.centered || []).map((name) => [name, targets[name] || null]));
    const scrollOwners = [...document.querySelectorAll("body *")]
      .filter(visible)
      .map((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const allowlistEntry = allowlist.find((entry) => node.matches(entry.selector));
        return {
          selector: labelFor(node),
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          left: rect.left,
          right: rect.right,
          overflowX: style.overflowX,
          allowedBy: allowlistEntry?.selector || null,
        };
      })
      .filter((entry) => ["auto", "scroll"].includes(entry.overflowX) && entry.scrollWidth > entry.clientWidth + tolerance);
    const horizontalOwners = scrollOwners.filter((entry) => !entry.allowedBy);
    const allowedHorizontalOwners = scrollOwners.filter((entry) => entry.allowedBy);
    const offenders = [...document.querySelectorAll("body *")]
      .filter(visible)
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          selector: labelFor(node),
          left: rect.left,
          right: rect.right,
          width: rect.width,
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          overflowX: style.overflowX,
          minWidth: style.minWidth,
          display: style.display,
          position: style.position,
        };
      })
      .filter((entry) => entry.left < visualLeft - tolerance || entry.right > visualRight + tolerance || entry.scrollWidth > entry.clientWidth + tolerance)
      .sort((a, b) => Math.max(b.right - visualRight, b.scrollWidth - b.clientWidth) - Math.max(a.right - visualRight, a.scrollWidth - a.clientWidth))
      .slice(0, 12);

    return {
      viewport: { layoutWidth, visualLeft, visualWidth, visualRight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
      body: {
        clientWidth: document.body.clientWidth,
        scrollWidth: document.body.scrollWidth,
      },
      scroll: {
        windowX: window.scrollX,
        documentX: document.scrollingElement?.scrollLeft || 0,
        bodyX: document.body.scrollLeft || 0,
        visualX: window.visualViewport?.offsetLeft || 0,
      },
      targets,
      centered,
      horizontalOwners,
      allowedHorizontalOwners,
      offenders,
    };
  }, { contract, allowlist: INTENTIONAL_HORIZONTAL_SCROLL_ALLOWLIST });
}

export async function performHorizontalPointerGesture(page, selector, browserName) {
  const target = page.locator(selector);
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error(`Cannot gesture on ${selector}`);
  const innerY = Math.min(Math.max(8, box.height * 0.2), Math.max(8, box.height - 8));
  const y = Math.round(Math.min(viewport.height - 8, Math.max(8, box.y + innerY)));
  const startX = Math.round(Math.min(viewport.width - 24, box.x + box.width * 0.78));
  const endX = Math.round(Math.max(24, box.x + box.width * 0.22));

  if (browserName === "chromium") {
    const session = await page.context().newCDPSession(page);
    try {
      await session.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y }] });
      for (let step = 1; step <= 7; step += 1) {
        const x = Math.round(startX + ((endX - startX) * step) / 7);
        await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } finally {
      await session.detach();
    }
  } else {
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 7 });
    await page.mouse.up();
  }
  await page.waitForTimeout(120);
}

export async function performLocalHorizontalGesture(page, selector, browserName) {
  const target = page.locator(selector);
  await expect(target).toBeVisible();
  await target.scrollIntoViewIfNeeded();
  const before = await target.evaluate((node) => ({
    scrollLeft: node.scrollLeft,
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));

  if (before.scrollWidth <= before.clientWidth + MOBILE_GEOMETRY_TOLERANCE) {
    return { method: "not-scrollable", before, after: before };
  }

  // Playwright intentionally does not expose mouse.wheel for mobile WebKit.
  // Preserve Chromium's wheel interaction coverage, but prove the same local
  // scroll ownership in WebKit by moving only the allowlisted element's own
  // scrollLeft. This cannot hide document/body drift because the full geometry
  // contract is re-measured immediately afterward.
  if (browserName === "webkit") {
    const after = await target.evaluate(async (node) => {
      const maximum = Math.max(0, node.scrollWidth - node.clientWidth);
      const next = Math.min(maximum, Math.max(node.scrollLeft + 40, Math.round(maximum * 0.5)));
      node.scrollLeft = next;
      node.dispatchEvent(new Event("scroll"));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        scrollLeft: node.scrollLeft,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
      };
    });
    return { method: "element-scrollLeft", before, after };
  }

  const box = await target.boundingBox();
  if (!box) throw new Error(`Cannot gesture on ${selector}`);
  await page.mouse.move(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
  await page.mouse.wheel(180, 0);
  await page.waitForTimeout(120);
  const after = await target.evaluate((node) => ({
    scrollLeft: node.scrollLeft,
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  return { method: "mouse-wheel", before, after };
}

export function expectMobileGeometry(report, label) {
  const diagnostic = `${label}\n${JSON.stringify(report, null, 2)}`;
  expect(report.document.scrollWidth, diagnostic).toBeLessThanOrEqual(report.document.clientWidth + MOBILE_GEOMETRY_TOLERANCE);
  expect(report.body.scrollWidth, diagnostic).toBeLessThanOrEqual(report.body.clientWidth + MOBILE_GEOMETRY_TOLERANCE);
  expect(Math.abs(report.scroll.windowX), diagnostic).toBeLessThanOrEqual(MOBILE_GEOMETRY_TOLERANCE);
  expect(Math.abs(report.scroll.documentX), diagnostic).toBeLessThanOrEqual(MOBILE_GEOMETRY_TOLERANCE);
  expect(Math.abs(report.scroll.bodyX), diagnostic).toBeLessThanOrEqual(MOBILE_GEOMETRY_TOLERANCE);
  expect(Math.abs(report.scroll.visualX), diagnostic).toBeLessThanOrEqual(MOBILE_GEOMETRY_TOLERANCE);
  expect(report.horizontalOwners, `${label} has unapproved horizontal scroll owners\n${JSON.stringify(report.horizontalOwners, null, 2)}`).toEqual([]);

  for (const [name, entry] of Object.entries(report.targets)) {
    expect(entry, `${label} missing required geometry target "${name}"`).not.toBeNull();
    expect(entry.left, `${label} ${name}\n${diagnostic}`).toBeGreaterThanOrEqual(report.viewport.visualLeft - MOBILE_GEOMETRY_TOLERANCE);
    expect(entry.right, `${label} ${name}\n${diagnostic}`).toBeLessThanOrEqual(report.viewport.visualRight + MOBILE_GEOMETRY_TOLERANCE);
  }

  for (const [name, entry] of Object.entries(report.centered)) {
    expect(entry, `${label} missing centered target "${name}"`).not.toBeNull();
    const leftRail = entry.left - report.viewport.visualLeft;
    const rightRail = report.viewport.visualRight - entry.right;
    expect(Math.abs(leftRail - rightRail), `${label} ${name} rails ${leftRail}/${rightRail}\n${diagnostic}`).toBeLessThanOrEqual(MOBILE_GEOMETRY_TOLERANCE);
  }
}

export async function assertMobileGeometry(page, contract, { label, browserName }) {
  await waitForRequiredGeometryTargets(page, contract, label);
  const before = await collectMobileGeometry(page, contract);
  expectMobileGeometry(before, `${label} before gesture`);
  const localScrollProof = [];
  for (const selector of contract.localScrollSelectors || []) {
    const entry = INTENTIONAL_HORIZONTAL_SCROLL_ALLOWLIST.find((candidate) => candidate.selector === selector);
    expect(entry, `${label} references an undocumented local horizontal scroller: ${selector}`).toBeTruthy();
    const owner = page.locator(entry.selector);
    if (await owner.count() === 0) continue;
    const beforeLocal = await owner.evaluate((node) => ({ scrollLeft: node.scrollLeft, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth }));
    if (beforeLocal.scrollWidth <= beforeLocal.clientWidth + MOBILE_GEOMETRY_TOLERANCE) continue;
    const localInteraction = await performLocalHorizontalGesture(page, entry.selector, browserName);
    const afterLocal = await owner.evaluate((node) => ({ scrollLeft: node.scrollLeft, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth }));
    expect(afterLocal.scrollLeft, `${label} ${entry.component} did not accept the local horizontal interaction`).toBeGreaterThan(beforeLocal.scrollLeft + MOBILE_GEOMETRY_TOLERANCE);
    const afterLocalReport = await collectMobileGeometry(page, contract);
    expectMobileGeometry(afterLocalReport, `${label} after local ${entry.component} interaction`);
    localScrollProof.push({ ...entry, method: localInteraction.method, before: beforeLocal, after: afterLocal, pageScroll: afterLocalReport.scroll });
  }
  await performHorizontalPointerGesture(page, contract.targets.workspace, browserName);
  const after = await collectMobileGeometry(page, contract);
  expectMobileGeometry(after, `${label} after gesture`);
  for (const name of contract.centered || []) {
    const beforeEntry = before.centered[name];
    const afterEntry = after.centered[name];
    expect(Math.abs(afterEntry.left - beforeEntry.left), `${label} ${name} left shifted after gesture`).toBeLessThanOrEqual(MOBILE_GEOMETRY_TOLERANCE);
    expect(Math.abs(afterEntry.right - beforeEntry.right), `${label} ${name} right shifted after gesture`).toBeLessThanOrEqual(MOBILE_GEOMETRY_TOLERANCE);
  }
  return { before, after, localScrollProof };
}
