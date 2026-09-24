import { test, expect } from "@playwright/test";

async function installRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function enterDemo(page, role) {
  await page.goto("/");
  await page.getByRole("button", { name: role === "coach" ? "Coach demo" : "Player demo", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function readSemanticVariables(page) {
  return page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    const read = (name) => styles.getPropertyValue(name).trim().toLowerCase();
    return {
      brand: read("--team-brand-primary"),
      success: read("--semantic-success"),
      info: read("--semantic-info"),
      warning: read("--semantic-warning"),
      danger: read("--semantic-danger"),
      neutral: read("--semantic-neutral"),
    };
  });
}

async function computedColorForVariable(page, variableName) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, variableName);
}

async function readFlatSurfaceStyle(locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderLeftWidth: style.borderLeftWidth,
      borderRadius: style.borderRadius,
    };
  });
}

const expectFlatSurface = (style) => {
  expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(style.backgroundColor);
  expect(style.backgroundImage).toBe("none");
  expect(style.boxShadow).toBe("none");
  expect(style.borderTopWidth).toBe("0px");
  expect(style.borderRightWidth).toBe("0px");
  expect(style.borderBottomWidth).toBe("0px");
  expect(style.borderLeftWidth).toBe("0px");
  expect(style.borderRadius).toBe("0px");
};

async function readRosterCascadeAudit(page, row) {
  return row.evaluate((root) => {
    const selectors = [
      ".coachRosterCard__details",
      ".coachRosterCard__identity",
      "[data-phase1-open-profile=\"true\"]",
      ".coachRosterCard__metrics",
      ".coachRosterCard__actions",
    ];
    const targets = selectors.map((selector) => [selector, root.querySelector(selector)]).filter(([, node]) => node);
    const found = [];
    const visit = (rules, owner) => {
      for (const rule of Array.from(rules || [])) {
        if (rule.cssRules) visit(rule.cssRules, owner);
        if (!rule.selectorText || !rule.style) continue;
        for (const [target, node] of targets) {
          let matches = false;
          try { matches = node.matches(rule.selectorText); } catch {}
          if (!matches) continue;
          const properties = {};
          for (const name of ["background", "background-color", "box-shadow", "border", "border-radius", "padding", "margin"]) {
            const value = rule.style.getPropertyValue(name);
            if (value) properties[name] = { value, priority: rule.style.getPropertyPriority(name) };
          }
          if (Object.keys(properties).length) found.push({ target, owner, selector: rule.selectorText, properties });
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try { visit(sheet.cssRules, sheet.href || sheet.ownerNode?.id || sheet.ownerNode?.getAttribute?.("data-vite-dev-id") || "inline"); } catch {}
    }
    return found;
  });
}

test("semantic state variables remain fixed and distinct from team branding", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await enterDemo(page, "player");

  const variables = await readSemanticVariables(page);
  for (const key of ["success", "info", "warning", "danger", "neutral"]) {
    expect(variables[key]).not.toBe("");
  }
  expect(new Set([variables.success, variables.info, variables.warning, variables.danger, variables.neutral]).size).toBe(5);
  expect(variables.warning).not.toBe(variables.brand);
  expect(variables.info).not.toBe(variables.brand);
  expect(variables.danger).not.toBe(variables.brand);
});

test("coach roster computed cascade stays flat and semantic at 390px", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await enterDemo(page, "coach");

  const dock = page.getByTestId("mobile-navigation-dock");
  await dock.getByRole("button", { name: "Players", exact: true }).click();

  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  const row = roster.locator(".phase1RosterRow").first();
  await expect(row).toBeVisible({ timeout: 20_000 });

  for (const selector of [
    ".coachRosterCard__details",
    ".coachRosterCard__identity",
    "[data-phase1-open-profile=\"true\"]",
    ".coachRosterCard__metrics",
  ]) {
    const target = row.locator(selector);
    await expect(target).toBeAttached();
    expectFlatSurface(await readFlatSurfaceStyle(target));
  }

  const rowBox = await row.boundingBox();
  expect(rowBox?.height || 0).toBeGreaterThanOrEqual(76);
  expect(rowBox?.height || 999).toBeLessThanOrEqual(84);

  const manage = row.locator(".coachRosterCard__manageTrigger");
  const manageBox = await manage.boundingBox();
  expect(manageBox?.width || 0).toBeGreaterThanOrEqual(44);
  expect(manageBox?.height || 0).toBeGreaterThanOrEqual(44);
  const profile = row.locator('[data-phase1-open-profile="true"]');
  await expect(profile).toBeVisible();

  const audit = await readRosterCascadeAudit(page, row);
  console.log(`ROSTER_CASCADE_AUDIT=${JSON.stringify(audit)}`);
  await testInfo.attach("roster-cascade-audit.json", { body: JSON.stringify(audit, null, 2), contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("coach-roster-390.png"), fullPage: true });

  const pathBeforeManage = new URL(page.url()).pathname;
  await manage.click();
  await expect(row.getByRole("button", { name: "REMOVE", exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(pathBeforeManage);
  await page.screenshot({ path: testInfo.outputPath("coach-roster-menu-390.png"), fullPage: true });
  await manage.click();

  await profile.click();
  await expect(page.getByTestId("coach-player-intelligence-drawer")).toBeVisible({ timeout: 20_000 });

  const status = page.getByTestId("semantic-roster-status").first();
  await expect(status).toBeAttached({ timeout: 20_000 });
  const tone = await status.getAttribute("data-tone");
  expect(["success", "warning", "danger"]).toContain(tone);
  if (tone === "success") await expect(status).toBeHidden();
  else await expect(status).toBeVisible();
  const expectedStatusColor = await computedColorForVariable(page, `--semantic-${tone}`);
  const actualStatusColor = await status.evaluate((node) => getComputedStyle(node).color);
  expect(actualStatusColor).toBe(expectedStatusColor);
});

test("Schedule metadata renders with the semantic info role", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await enterDemo(page, "coach");

  const dock = page.getByTestId("mobile-navigation-dock");
  await dock.getByRole("button", { name: "Schedule", exact: true }).click();
  const eventsPage = page.locator('.pageShell[data-accent="events"]').first();
  await expect(eventsPage).toBeVisible({ timeout: 20_000 });
  const expectedInfoColor = await computedColorForVariable(page, "--semantic-info");
  const actualEventAccent = await eventsPage.evaluate((node) => {
    const probe = document.createElement("span");
    probe.style.color = "var(--pageAccent)";
    node.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  expect(actualEventAccent).toBe(expectedInfoColor);
});
