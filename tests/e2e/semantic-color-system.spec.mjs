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

test("coach roster statuses and event metadata render with semantic roles", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await enterDemo(page, "coach");

  const dock = page.getByTestId("mobile-navigation-dock");
  await dock.getByRole("button", { name: "Players", exact: true }).click();

  const status = page.getByTestId("semantic-roster-status").first();
  await expect(status).toBeVisible({ timeout: 20_000 });
  const tone = await status.getAttribute("data-tone");
  expect(["success", "warning", "danger"]).toContain(tone);
  const expectedStatusColor = await computedColorForVariable(page, `--semantic-${tone}`);
  const actualStatusColor = await status.evaluate((node) => getComputedStyle(node).color);
  expect(actualStatusColor).toBe(expectedStatusColor);

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
