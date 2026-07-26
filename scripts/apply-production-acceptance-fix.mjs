import fs from "node:fs";

const replaceExact = (path, before, after) => {
  const source = fs.readFileSync(path, "utf8");
  if (!source.includes(before)) {
    throw new Error(`Expected source block not found in ${path}`);
  }
  fs.writeFileSync(path, source.replace(before, after));
};

const remotePath = "src/lib/remotePersistence.js";
replaceExact(
  remotePath,
`export const normalizePlayerRowForApp = (row = {}) => {
  const teamId = cleanText(row.team_id || row.teamId);
  const email = cleanText(row.email).toLowerCase();
  const id = cleanText(row.id || (teamId && email ? \`player:\${teamId}:\${email}\` : ""));
  if (!id || !teamId || !email) return null;
  const payload = {
    id,
    teamId,
    email,
    name: cleanText(row.name),
    role: cleanText(row.role),
    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),
    updatedAt: toFiniteNumber(row.updatedAt ?? row.updated_at),
    hideFromLeaderboards:
      typeof row.hideFromLeaderboards === "boolean"
        ? row.hideFromLeaderboards
        : typeof row.hide_from_leaderboards === "boolean"
          ? row.hide_from_leaderboards
          : undefined,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== undefined));
};

export const normalizePlayerRowForDb = (row = {}) => {
  const app = normalizePlayerRowForApp(row);
  if (!app) return null;
  const payload = {
    id: app.id,
    team_id: app.teamId,
    email: app.email,
    name: app.name,
    role: app.role,
    created_at: app.createdAt,
    updated_at: app.updatedAt,
    hide_from_leaderboards: app.hideFromLeaderboards,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== undefined));
};`,
`export const normalizePlayerRowForApp = (row = {}) => {
  const teamId = cleanText(row.team_id ?? row.teamId);
  const email = cleanText(row.email).toLowerCase();
  const id = cleanText(row.id || (teamId && email ? \`player:\${teamId}:\${email}\` : email ? \`player:unassigned:\${email}\` : ""));
  if (!id || !email) return null;
  const payload = {
    id,
    teamId: teamId || null,
    email,
    name: cleanText(row.name),
    role: cleanText(row.role),
    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),
    updatedAt: toFiniteNumber(row.updatedAt ?? row.updated_at),
    hideFromLeaderboards:
      typeof row.hideFromLeaderboards === "boolean"
        ? row.hideFromLeaderboards
        : typeof row.hide_from_leaderboards === "boolean"
          ? row.hide_from_leaderboards
          : undefined,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined));
};

export const normalizePlayerRowForDb = (row = {}) => {
  const app = normalizePlayerRowForApp(row);
  if (!app) return null;
  const payload = {
    id: app.id,
    team_id: app.teamId || null,
    email: app.email,
    name: app.name,
    role: app.role,
    created_at: app.createdAt,
    updated_at: app.updatedAt,
    hide_from_leaderboards: app.hideFromLeaderboards,
  };
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => key === "team_id" || (value !== null && value !== "" && value !== undefined)));
};`
);

replaceExact(
  "src/lib/playerDataManagement.js",
`  const inactivePlayerKeys = new Set(allPlayers
    .filter((player) => isHiddenRosterRecord(player) && (rowTeamId(player) === targetTeamId || rowRemovedFromTeamId(player) === targetTeamId))
    .flatMap((player) => rosterMergeKeys(player)));`,
`  const inactivePlayerKeys = new Set(allPlayers
    .filter((player) => isHiddenRosterRecord(player) && (!rowTeamId(player) || rowTeamId(player) === targetTeamId || rowRemovedFromTeamId(player) === targetTeamId))
    .flatMap((player) => rosterMergeKeys(player)));`
);

replaceExact(
  "tests/remote-persistence-shape.test.mjs",
`  normalizeEventRowForDb,
  normalizeEventRowForApp,
  formatRemotePersistErrorForDebug,`,
`  normalizeEventRowForDb,
  normalizeEventRowForApp,
  normalizePlayerRowForApp,
  normalizePlayerRowForDb,
  formatRemotePersistErrorForDebug,`
);
fs.appendFileSync("tests/remote-persistence-shape.test.mjs", `

test('removed player persistence keeps a nullable team assignment and hidden tombstone', () => {
  const dbRow = normalizePlayerRowForDb({
    id: 'player-removed',
    email: 'removed@team.test',
    name: 'Removed Player',
    role: 'player',
    teamId: null,
    hideFromLeaderboards: true,
  });

  assert.deepEqual(dbRow, {
    id: 'player-removed',
    team_id: null,
    email: 'removed@team.test',
    name: 'Removed Player',
    role: 'player',
    hide_from_leaderboards: true,
  });

  const appRow = normalizePlayerRowForApp(dbRow);
  assert.equal(appRow.teamId, null);
  assert.equal(appRow.hideFromLeaderboards, true);
  assert.equal(appRow.email, 'removed@team.test');
});
`);

fs.appendFileSync("tests/player-removal-lifecycle-stabilization.test.mjs", `

test('hidden unassigned account row suppresses a stale team profile after hydration', () => {
  const roster = getCoachRosterPlayers({
    teamId,
    players: [
      activePlayer,
      {
        id: 'player-removed',
        email: 'removed@team.test',
        name: 'Removed Player',
        role: 'player',
        teamId: null,
        hideFromLeaderboards: true,
      },
    ],
    playerProfiles: [activeProfile, removedProfile],
  });

  assert.deepEqual(roster.map((player) => player.email), ['active@team.test']);
});
`);

const acceptancePath = "tests/e2e/production-acceptance.spec.mjs";
let acceptance = fs.readFileSync(acceptancePath, "utf8");
acceptance = acceptance.replace(
`      role: "player",
      teamId: TEAM_ID,
      removedFromTeamId: TEAM_ID,
      removed: true,
      rosterStatus: "removed",
      removedAt: "2026-07-25T12:00:00.000Z",`,
`      role: "player",
      teamId: null,
      hideFromLeaderboards: true,
      removedFromTeamId: TEAM_ID,
      removed: true,
      rosterStatus: "removed",
      removedAt: "2026-07-25T12:00:00.000Z",`
);
acceptance = acceptance.replace(
`async function readTeamBranding(page) {`,
`const stripCacheBuster = (value = "") => String(value).split("?")[0];

async function readTeamBranding(page) {`
);
acceptance = acceptance.replace(
`  expect(savedBranding?.logoUrl).toMatch(/^data:image\\/png;base64,/);
  expect(savedBranding?.logoMarkUrl).toMatch(/^data:image\\/png;base64,/);
  expect(await heroLogo.getAttribute("src")).toBe(savedBranding.logoMarkUrl);`,
`  expect(stripCacheBuster(savedBranding?.logoUrl)).toBe(FULL_LOGO_URL);
  expect(stripCacheBuster(savedBranding?.logoMarkUrl)).toBe(MARK_LOGO_URL);
  expect(stripCacheBuster(await heroLogo.getAttribute("src"))).toBe(MARK_LOGO_URL);`
);
fs.writeFileSync(acceptancePath, acceptance);

console.log("Applied production acceptance persistence patch.");
