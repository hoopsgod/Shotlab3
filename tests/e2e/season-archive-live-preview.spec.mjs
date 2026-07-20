import { test, expect } from "@playwright/test";

const PREVIEW_URL = process.env.LIVE_PREVIEW_URL;
if (!PREVIEW_URL) throw new Error("LIVE_PREVIEW_URL is required");

const LIVE_DATA_KEYS = [
  "sl:teams",
  "sl:players",
  "sl:player-profiles",
  "sl:scores",
  "sl:program-scores",
  "sl:shotlogs",
  "sl:events",
  "sl:rsvps",
  "sl:sc-sessions",
  "sl:sc-rsvps",
  "sl:sc-logs",
];

async function enterCoachDemo(page, onBeforeClick = () => {}) {
  const demoCoach = page.getByRole("button", { name: "Demo Coach", exact: true });
  const players = page.getByRole("button", { name: "Players", exact: true });
  await expect(page.locator("body")).not.toBeEmpty({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /^(Demo Coach|Players)$/ }).first()).toBeVisible({ timeout: 20_000 });
  if (await demoCoach.isVisible().catch(() => false)) {
    onBeforeClick();
    await demoCoach.click();
  }
  await expect(players).toBeVisible({ timeout: 20_000 });
  return players;
}

async function snapshotLiveCollections(page) {
  return page.evaluate((keys) => Object.fromEntries(keys.map((key) => [key, window.localStorage.getItem(key)])), LIVE_DATA_KEYS);
}

test("corrected Cloudflare preview completes isolated demo-local season archive flow", async ({ page, request }) => {
  const consoleErrors = [];
  const productionRestWrites = [];
  let demoInteractionStarted = false;

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (networkRequest) => {
    if (
      demoInteractionStarted
      && /\.supabase\.co\/rest\/v1\//.test(networkRequest.url())
      && networkRequest.method() !== "GET"
    ) {
      productionRestWrites.push({
        method: networkRequest.method(),
        url: networkRequest.url(),
        body: networkRequest.postData() || "",
      });
    }
  });

  await page.goto(PREVIEW_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await expect(page).toHaveTitle(/ShotLab/i, { timeout: 20_000 });

  const playersButton = await enterCoachDemo(page, () => {
    productionRestWrites.length = 0;
    demoInteractionStarted = true;
  });
  demoInteractionStarted = true;
  await playersButton.click();

  const panel = page.getByTestId("coach-season-archive");
  await expect(panel).toBeVisible({ timeout: 20_000 });

  const liveBefore = await snapshotLiveCollections(page);
  const archiveName = `Live Corrected Archive ${Date.now()}`;
  await panel.getByPlaceholder("2026 Summer").fill(archiveName);
  const dates = panel.locator('input[type="date"]');
  await expect(dates).toHaveCount(2);
  await dates.nth(0).fill("2026-01-01");
  await dates.nth(1).fill("2026-12-31");
  await panel.getByRole("button", { name: "Archive Season", exact: true }).click();
  await panel.getByRole("button", { name: /^confirm archive$/i }).click();

  const status = panel.getByRole("status");
  await expect(status).toContainText(`Archived ${archiveName}.`, { timeout: 30_000 });

  const archiveButton = panel.getByRole("button", { name: `View archive ${archiveName}`, exact: true });
  await expect(archiveButton).toBeVisible();

  const storedArchive = await page.evaluate((name) => {
    const archives = JSON.parse(window.localStorage.getItem("sl:season-archives") || "[]");
    return archives.find((row) => row.seasonName === name) || null;
  }, archiveName);
  expect(storedArchive).toMatchObject({
    seasonName: archiveName,
    storageMode: "demo_local",
    demoLocalOnly: true,
  });

  await archiveButton.click();
  const detail = panel.getByTestId("season-archive-detail");
  await expect(detail).toBeVisible();
  await expect(detail).toContainText(archiveName);
  expect(await snapshotLiveCollections(page)).toEqual(liveBefore);

  const demoLoadResponse = await request.get(`${PREVIEW_URL}/v1/season-archives`, {
    headers: { "x-user-id": "coach.demo@shotlab.app" },
  });
  expect(demoLoadResponse.status()).toBe(409);
  expect(await demoLoadResponse.json()).toMatchObject({ error: "demo_local_only", local_only: true });

  const demoMarkers = [
    "demo@shotlab.app",
    "coach.demo@shotlab.app",
    String(storedArchive?.teamId || ""),
  ].filter(Boolean);
  const demoProductionWrites = productionRestWrites.filter((write) =>
    demoMarkers.some((marker) => write.body.includes(marker)),
  );
  expect(
    demoProductionWrites.map((write) => `${write.method} ${write.url}`),
    "Demo Coach must never write demo identities or the generated demo team to production Supabase",
  ).toEqual([]);

  const relevantConsoleErrors = consoleErrors.filter((message) =>
    message.includes("[remote-persist] upsert failed")
    || message.includes("PGRST102")
    || message.includes("PGRST204")
    || message.includes("Only an authorized coach"),
  );
  expect(relevantConsoleErrors).toEqual([]);
});
