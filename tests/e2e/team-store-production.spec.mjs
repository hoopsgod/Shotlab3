import { test, expect } from "@playwright/test";

const COACH_EMAIL = "release-gate-coach@shotlab.test";
const PLAYER_EMAIL = "release-gate-player@shotlab.test";
const TEAM_ID = "release-gate-team";
const TEAM_NAME = "ShotLab Release Gate";
const STORE_URL = "https://example.com/shotlab-team-store";

const seedIdentity = {
  session: {
    id: "release-gate-coach",
    email: COACH_EMAIL,
    role: "coach",
    isCoach: true,
    teamId: TEAM_ID,
  },
  players: [
    {
      id: "release-gate-coach",
      userId: "release-gate-coach",
      email: COACH_EMAIL,
      role: "coach",
      isCoach: true,
      teamId: TEAM_ID,
    },
    {
      id: "release-gate-player",
      userId: "release-gate-player",
      email: PLAYER_EMAIL,
      role: "player",
      isCoach: false,
      teamId: TEAM_ID,
    },
  ],
  teams: [{ id: TEAM_ID, name: TEAM_NAME, teamName: TEAM_NAME }],
};

test("production Team Store supports the isolated coach-to-player journey", async ({ page }) => {
  const blockedWrites = [];

  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) {
      blockedWrites.push(`${request.method()} ${request.url()}`);
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });

  await page.addInitScript(({ identity }) => {
    const isolatedStorage = {
      async get(key) {
        const value = window.localStorage.getItem(key);
        return value == null ? null : { value };
      },
      async set(key, value) {
        const serialized = String(value ?? "null");
        window.localStorage.setItem(key, serialized);
        return { value: serialized };
      },
      async delete(key) {
        window.localStorage.removeItem(key);
        return { deleted: true };
      },
    };
    Object.defineProperty(window, "storage", {
      value: isolatedStorage,
      configurable: false,
      enumerable: false,
      writable: false,
    });

    if (window.localStorage.getItem("sl:release-gate-initialized") === "true") return;
    window.localStorage.setItem("sl:session", JSON.stringify(identity.session));
    window.localStorage.setItem("sl:players", JSON.stringify(identity.players));
    window.localStorage.setItem("sl:teams", JSON.stringify(identity.teams));
    window.localStorage.setItem("sl:team-stores", "[]");
    window.localStorage.setItem("sl:team-store-clicks", "[]");
    window.localStorage.setItem("sl:release-gate-initialized", "true");
  }, { identity: seedIdentity });

  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30_000 });
  await expect(page).toHaveTitle(/ShotLab/i);
  await expect(page.locator("#team-store-root")).toBeAttached();

  const storeLauncher = page.getByRole("button", { name: "Open team store" });
  await expect(storeLauncher).toBeVisible({ timeout: 20_000 });
  await storeLauncher.click();

  let dialog = page.getByRole("dialog", { name: "Team Store" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(TEAM_NAME);
  await expect(dialog.getByRole("button", { name: "PUBLISH STORE" })).toBeVisible();

  const urlInput = dialog.getByLabel("Secure store URL");
  await urlInput.fill("http://example.com/insecure");
  await dialog.getByRole("button", { name: "PUBLISH STORE" }).click();
  await expect(dialog.getByRole("alert")).toContainText("must use https");

  await urlInput.fill(STORE_URL);
  await dialog.getByRole("button", { name: "PUBLISH STORE" }).click();
  await expect(dialog.getByText("LIVE", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "OPEN STORE" })).toBeVisible();

  const coachState = await page.evaluate(() => ({
    stores: JSON.parse(window.localStorage.getItem("sl:team-stores") || "[]"),
    clicks: JSON.parse(window.localStorage.getItem("sl:team-store-clicks") || "[]"),
  }));
  expect(coachState.stores).toHaveLength(1);
  expect(coachState.stores[0]).toMatchObject({
    teamId: "release-gate-team",
    storeName: "Official Team Store",
    storeUrl: "https://example.com/shotlab-team-store",
    status: "active",
  });
  expect(coachState.clicks).toEqual([]);

  await page.evaluate(({ playerEmail }) => {
    const session = JSON.parse(window.localStorage.getItem("sl:session") || "{}");
    window.localStorage.setItem("sl:session", JSON.stringify({
      ...session,
      id: "release-gate-player",
      email: playerEmail,
      role: "player",
      isCoach: false,
    }));
  }, { playerEmail: PLAYER_EMAIL });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(storeLauncher).toBeVisible({ timeout: 20_000 });
  await storeLauncher.click();

  dialog = page.getByRole("dialog", { name: "Team Store" });
  await expect(dialog.getByRole("button", { name: "SHOP TEAM STORE" })).toBeVisible();
  await expect(dialog).toContainText("ShotLab may earn a commission");
  await expect(dialog).toContainText("Official Team Store");

  const allowedBlockedWrite = /^(POST|PUT|PATCH|DELETE) https:\/\/[^/]+\/v1\/(players|player-profiles|legacy-auth\/restore)$/;
  const unexpectedWrites = blockedWrites.filter((write) => !allowedBlockedWrite.test(write));
  expect(
    unexpectedWrites,
    "The release gate must abort every write and permit only ShotLab's known background identity restore attempts",
  ).toEqual([]);
});
