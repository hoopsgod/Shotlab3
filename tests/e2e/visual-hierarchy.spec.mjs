test("coach mobile home answers the 30-second workflow and Events remains a standalone schedule page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "coach");

  const commandCenter = page.getByTestId("coach-command-center-full");
  const objective = page.getByTestId("coach-primary-objective");
  const metrics = page.getByTestId("coach-primary-metrics");
  const needsAttention = page.getByRole("heading", { name: "Needs attention", exact: true });
  const teamActivity = page.getByRole("heading", { name: "Team activity", exact: true });
  const nextSession = page.getByRole("heading", { name: "Next session", exact: true });

  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  await expect(objective).toBeVisible();
  await expectThreeMetrics(metrics);
  await expect(needsAttention).toBeVisible();
  await expect(teamActivity).toBeVisible();
  await expect(nextSession).toBeVisible();
  await expect(page.getByTestId("coach-dashboard-identity-header")).not.toBeVisible();
  await expect(page.locator(".coach-home-dashboard")).not.toBeVisible();

  const shellBox = await commandCenter.boundingBox();
  const objectiveBox = await objective.boundingBox();
  const attentionBox = await needsAttention.boundingBox();
  expect(shellBox).not.toBeNull();
  expect(objectiveBox).not.toBeNull();
  expect(attentionBox).not.toBeNull();
  expect(shellBox.x).toBeLessThanOrEqual(1);
  expect(shellBox.width).toBeGreaterThanOrEqual(388);
  const leftGutter = objectiveBox.x;
  const rightGutter = 390 - (objectiveBox.x + objectiveBox.width);
  expect(leftGutter).toBeGreaterThanOrEqual(8);
  expect(rightGutter).toBeGreaterThanOrEqual(8);
  expect(leftGutter).toBeLessThanOrEqual(16);
  expect(rightGutter).toBeLessThanOrEqual(16);
  expect(Math.abs(leftGutter - rightGutter)).toBeLessThanOrEqual(2);
  expect(objectiveBox.height).toBeLessThan(350);
  expect(attentionBox.y).toBeLessThan(844);
  await expectNoHorizontalOverflow(page);

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible();
  await dock.getByRole("button", { name: "Events", exact: true }).click();

  const eventsPage = page.getByTestId("coach-events-mobile-page");
  const eventsHeader = page.getByTestId("coach-events-mobile-header");
  const emptyState = page.getByTestId("coach-events-mobile-empty-state");
  const createEvent = page.getByTestId("coach-events-mobile-create-event");

  await expect(eventsPage).toBeVisible({ timeout: 20_000 });
  await expect(eventsHeader).toBeVisible();
  await expect(emptyState).toBeVisible();
  await expect(createEvent).toBeVisible();
  await expect(page.getByTestId("coach-command-center-full")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log out", exact: true })).not.toBeVisible();

  expect(await eventsPage.evaluate((node) => node.closest(".accent-card") !== null)).toBe(false);
  const headerBox = await eventsHeader.boundingBox();
  const emptyBox = await emptyState.boundingBox();
  const createBox = await createEvent.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(emptyBox).not.toBeNull();
  expect(createBox).not.toBeNull();
  expect(headerBox.y).toBeLessThan(150);
  expect(createBox.width).toBeLessThan(390 * 0.8);
  expect(createBox.y).toBeGreaterThan(headerBox.y + headerBox.height);
  expect(emptyBox.width).toBeLessThanOrEqual(390);
});
