import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { onRequestGet as getParticipationLeaderboards } from "../functions/v1/leaderboards/participation.js";
import { loadParticipationLeaderboards } from "../src/lib/participationLeaderboardService.js";
import {
  buildAllTimeEventParticipationLeaderboardRows,
  buildAllTimeStrengthParticipationLeaderboardRows,
  buildCurrentEventParticipationLeaderboardRows,
  buildCurrentStrengthParticipationLeaderboardRows,
} from "../src/lib/seasonLeaderboardAnalytics.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
};
const TEAM_ID = "team-a";
const players = [
  { id: "p1", playerId: "p1", email: "one@example.com", name: "One Player", role: "player", teamId: TEAM_ID },
  { id: "p2", playerId: "p2", email: "two@example.com", name: "Two Player", role: "player", teamId: TEAM_ID },
  { id: "hidden", playerId: "hidden", email: "hidden@example.com", name: "Hidden", role: "player", teamId: TEAM_ID, hideFromLeaderboards: true },
];
const archive = {
  id: "archive-1",
  teamId: TEAM_ID,
  seasonName: "2025-26",
  seasonStartDate: "2025-11-01",
  seasonEndDate: "2026-03-01",
  playerSeasonSummaries: [
    { playerId: "p1", email: "one@example.com", name: "One Player", eventRsvpCount: 2, scLogCount: 3 },
    { playerId: "p2", email: "two@example.com", name: "Two Player", eventRsvpCount: 4, scLogCount: 1 },
    { playerId: "alumni", email: "alumni@example.com", name: "Alumni Player", eventRsvpCount: 5, scLogCount: 4 },
  ],
};
const events = [
  { id: "inside", teamId: TEAM_ID, date: "2026-02-01" },
  { id: "event-1", teamId: TEAM_ID, date: "2026-07-01" },
  { id: "event-2", teamId: TEAM_ID, date: "2026-07-02" },
];
const rsvps = [
  { id: "inside-rsvp", eventId: "inside", teamId: TEAM_ID, playerId: "p1", email: "one@example.com", name: "One Player" },
  { id: "one-event-1", eventId: "event-1", teamId: TEAM_ID, playerId: "p1", email: "one@example.com", name: "One Player" },
  { id: "one-event-1-duplicate", eventId: "event-1", teamId: TEAM_ID, playerId: "p1", email: "one@example.com", name: "One Player" },
  { id: "two-event-1", eventId: "event-1", teamId: TEAM_ID, playerId: "p2", email: "two@example.com", name: "Two Player" },
  { id: "two-event-2", eventId: "event-2", teamId: TEAM_ID, playerId: "p2", email: "two@example.com", name: "Two Player" },
  { id: "hidden-event", eventId: "event-2", teamId: TEAM_ID, playerId: "hidden", email: "hidden@example.com", name: "Hidden" },
];
const scLogs = [
  { id: "one-log", teamId: TEAM_ID, playerId: "p1", email: "one@example.com", name: "One Player", date: "2026-07-03" },
  { id: "two-log-1", teamId: TEAM_ID, playerId: "p2", email: "two@example.com", name: "Two Player", date: "2026-07-03" },
  { id: "two-log-2", teamId: TEAM_ID, playerId: "p2", email: "two@example.com", name: "Two Player", date: "2026-07-04" },
  { id: "hidden-log", teamId: TEAM_ID, playerId: "hidden", email: "hidden@example.com", name: "Hidden", date: "2026-07-04" },
];

test("current participation rankings deduplicate events, exclude frozen ranges, and honor roster visibility", () => {
  const eventRows = buildCurrentEventParticipationLeaderboardRows({
    seasonArchives: [archive],
    teamId: TEAM_ID,
    events,
    rsvps,
    players,
  });
  const strengthRows = buildCurrentStrengthParticipationLeaderboardRows({
    seasonArchives: [archive],
    teamId: TEAM_ID,
    scLogs,
    players,
  });
  assert.deepEqual(eventRows.map((row) => [row.name, row.metricValue]), [
    ["Two Player", 2],
    ["One Player", 1],
  ]);
  assert.deepEqual(strengthRows.map((row) => [row.name, row.metricValue]), [
    ["Two Player", 2],
    ["One Player", 1],
  ]);
  assert.ok(eventRows.every((row) => row.timeScope === "current" && row.email !== "hidden@example.com"));
});

test("all-time participation rankings combine frozen summaries with live activity exactly once", () => {
  const eventRows = buildAllTimeEventParticipationLeaderboardRows({
    seasonArchives: [archive],
    teamId: TEAM_ID,
    events,
    rsvps,
    players,
  });
  const strengthRows = buildAllTimeStrengthParticipationLeaderboardRows({
    seasonArchives: [archive],
    teamId: TEAM_ID,
    scLogs,
    players,
  });
  assert.deepEqual(eventRows.map((row) => [row.name, row.metricValue, row.archivedTotal, row.currentTotal]), [
    ["Alumni Player", 5, 5, 0],
    ["Two Player", 6, 4, 2],
    ["One Player", 3, 2, 1],
  ].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
  assert.deepEqual(strengthRows.map((row) => [row.name, row.metricValue]), [
    ["Alumni Player", 4],
    ["One Player", 4],
    ["Two Player", 3],
  ]);
});

function eqValue(value) {
  const raw = String(value || "");
  return decodeURIComponent(raw.startsWith("eq.") ? raw.slice(3) : raw);
}

function installBackend() {
  const originalFetch = global.fetch;
  const tables = {
    players: players.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      team_id: row.teamId,
      hide_from_leaderboards: row.hideFromLeaderboards === true,
    })),
    events: events.map((row) => ({ id: row.id, team_id: row.teamId, date: row.date })),
    rsvps: rsvps.map((row) => ({ ...row, team_id: row.teamId, event_id: row.eventId, player_id: row.playerId })),
    sc_sessions: [],
    sc_logs: scLogs.map((row) => ({ ...row, team_id: row.teamId, player_id: row.playerId })),
    season_archives: [{
      id: archive.id,
      team_id: TEAM_ID,
      season_name: archive.seasonName,
      season_start_date: archive.seasonStartDate,
      season_end_date: archive.seasonEndDate,
      snapshot: archive,
    }],
  };
  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) return Response.json("uuid-one");
    if (url.pathname.endsWith("/legacy_auth_profiles")) return Response.json([{ team_id: TEAM_ID, role: "player" }]);
    if (url.pathname.endsWith("/team_memberships")) return Response.json([{ team_id: TEAM_ID, role: "player", status: "active" }]);
    if (url.pathname.endsWith("/teams")) return Response.json([]);
    const table = Object.keys(tables).find((name) => url.pathname.endsWith(`/${name}`));
    if (!table) return Response.json([]);
    return Response.json(tables[table].filter((row) => {
      for (const [key, value] of url.searchParams.entries()) {
        if (["select", "order", "limit"].includes(key)) continue;
        if (String(row?.[key] ?? "") !== eqValue(value)) return false;
      }
      return true;
    }));
  };
  return () => { global.fetch = originalFetch; };
}

test("signed aggregate route returns team rankings without exposing teammate records or emails", async () => {
  const restore = installBackend();
  try {
    const response = await getParticipationLeaderboards({
      request: new Request(`https://shotlab.test/v1/leaderboards/participation?team_id=${TEAM_ID}`, {
        headers: { "x-user-id": "one@example.com" },
      }),
      env: ENV,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.storage_mode, "signed_api");
    const eventRows = body.leaderboards.event_participation.current;
    assert.equal(eventRows.length, 2);
    assert.equal(eventRows.find((row) => row.is_current_user)?.player_display_name, "One Player");
    assert.ok(eventRows.every((row) => !Object.hasOwn(row, "email") && !Object.hasOwn(row, "rsvps")));
    assert.ok(body.leaderboards.strength_conditioning_participation.all_time.some((row) => row.player_display_name === "Alumni Player"));
  } finally {
    restore();
  }
});

test("production identity headers alone cannot read participation rankings", async () => {
  const response = await getParticipationLeaderboards({
    request: new Request(`https://app.shotlab.com/v1/leaderboards/participation?team_id=${TEAM_ID}`, {
      headers: { "x-user-id": "one@example.com" },
    }),
    env: ENV,
  });
  assert.equal(response.status, 401);
});

test("client accepts only explicit aggregate API payloads", async () => {
  const malformed = await loadParticipationLeaderboards({
    teamId: TEAM_ID,
    userEmail: "one@example.com",
    fetchImpl: async () => new Response("<!doctype html>", { status: 200, headers: { "content-type": "text/html" } }),
  });
  assert.equal(malformed.ok, false);
  const valid = await loadParticipationLeaderboards({
    teamId: TEAM_ID,
    userEmail: "one@example.com",
    fetchImpl: async () => Response.json({
      ok: true,
      storage_mode: "signed_api",
      leaderboards: {
        event_participation: { current: [{ rank: 1, player_id: "p1", player_display_name: "One", total: 3, is_current_user: true }], all_time: [] },
        strength_conditioning_participation: { current: [], all_time: [] },
      },
    }),
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.leaderboards.event_participation.current[0].isCurrentUser, true);
  assert.equal(valid.leaderboards.event_participation.current[0].metricValue, 3);
});

test("Competition Hub replaces both participation placeholders with ranked cards and complete data wiring", () => {
  const hub = fs.readFileSync(new URL("../src/components/PremiumLeaderboardsHub.jsx", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(hub, /Event leaders will appear after players check into team events/);
  assert.doesNotMatch(hub, /Strength leaders will appear after players complete assigned S&C work/);
  assert.match(hub, /rows=\{eventParticipationRows\}/);
  assert.match(hub, /rows=\{strengthParticipationRows\}/);
  assert.match(app, /events=\{events\} rsvps=\{rsvps\} scSessions=\{scSessions\} scLogs=\{scLogs\}/);
  assert.match(app, /events=\{safeEvents\} rsvps=\{safeRsvps\} scSessions=\{scSessions\} scLogs=\{safeScLogs\}/);
});
