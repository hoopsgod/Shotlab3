import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { transformSync } from "esbuild";

import { onRequestGet } from "../functions/v1/leaderboards/home-shots.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
};
const require = createRequire(import.meta.url);

function seedHomeShots() {
  return [
    { teamId: "team-a", playerId: "p1", name: "Ava", made: 120 },
    { teamId: "team-a", playerId: "p2", name: "Zoe", made: 120 },
    { teamId: "team-a", playerId: "p3", name: "Mia", made: 90 },
    { teamId: "team-a", playerId: "p4", name: "Noah", made: 0 },
  ];
}

function buildLeaderboardRows(shots) {
  const totals = new Map();
  shots.forEach((entry) => {
    if (entry.made <= 0) return;
    const existing = totals.get(entry.playerId) || { player_display_name: entry.name, total_home_shots: 0 };
    existing.total_home_shots += entry.made;
    totals.set(entry.playerId, existing);
  });

  return [...totals.entries()]
    .map(([playerId, data]) => ({ playerId, ...data }))
    .sort((a, b) => {
      if (b.total_home_shots !== a.total_home_shots) return b.total_home_shots - a.total_home_shots;
      if (a.player_display_name !== b.player_display_name) return a.player_display_name.localeCompare(b.player_display_name);
      return a.playerId.localeCompare(b.playerId);
    })
    .slice(0, 10)
    .map((entry, index) => ({
      rank: index + 1,
      player_display_name: entry.player_display_name,
      total_home_shots: entry.total_home_shots,
    }));
}

function loadCardComponent() {
  const source = fs.readFileSync(new URL("../src/components/HomeShotsLeaderboardCard.jsx", import.meta.url), "utf8");
  const transformed = transformSync(source, {
    loader: "jsx",
    format: "cjs",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    target: "es2020",
  }).code;
  const module = { exports: {} };
  const runner = new Function("require", "module", "exports", transformed);
  runner(require, module, module.exports);
  return module.exports.default || module.exports;
}

test("e2e: seed shot data -> fetch leaderboard -> verify order and values on both views", async () => {
  const seeded = seedHomeShots();
  const backendRows = buildLeaderboardRows(seeded);

  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify(backendRows), { status: 200 });

  try {
    const request = new Request("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-a&limit=10", {
      headers: { "x-user-id": "coach@team-a.test" },
    });

    const res = await onRequestGet({ request, env: ENV });
    assert.equal(res.status, 200);
    const payload = await res.json();

    assert.deepEqual(payload.leaderboard, backendRows);
    assert.equal(payload.leaderboard[0].player_display_name, "Ava");
    assert.equal(payload.leaderboard[1].player_display_name, "Zoe");
    assert.equal(payload.leaderboard[0].total_home_shots, 120);
    assert.equal(payload.leaderboard[1].total_home_shots, 120);

    const HomeShotsLeaderboardCard = loadCardComponent();
    const coachHtml = renderToStaticMarkup(
      React.createElement(HomeShotsLeaderboardCard, { status: "success", rows: payload.leaderboard, title: "TOP 10 HOME SHOTS" }),
    );
    const playerHtml = renderToStaticMarkup(
      React.createElement(HomeShotsLeaderboardCard, { status: "success", rows: payload.leaderboard, title: "TOP 10 HOME SHOTS" }),
    );
    assert.match(coachHtml, /TOP 10 HOME SHOTS/);
    assert.match(coachHtml, /AVA/);
    assert.match(coachHtml, /ZOE/);
    assert.match(playerHtml, /TOP 10 HOME SHOTS/);
    assert.match(playerHtml, /AVA/);
    assert.match(playerHtml, /ZOE/);

    const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
    assert.match(appSource, /tab===\"feed\"[\s\S]*?<HomeShotsLeaderboardCard/);
    assert.match(appSource, /tab===\"home\"[\s\S]*?<HomeShotsLeaderboardCard/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("e2e: player data only appears on registered team's coach dashboard leaderboard", async () => {
  const seeded = [
    { teamId: "team-a", playerId: "a1", name: "Ava", made: 140 },
    { teamId: "team-a", playerId: "a2", name: "Mia", made: 80 },
    { teamId: "team-b", playerId: "b1", name: "Noah", made: 210 },
    { teamId: "team-b", playerId: "b2", name: "Luca", made: 90 },
  ];
  const rowsByTeam = {
    "team-a": buildLeaderboardRows(seeded.filter((entry) => entry.teamId === "team-a")),
    "team-b": buildLeaderboardRows(seeded.filter((entry) => entry.teamId === "team-b")),
  };

  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    const body = JSON.parse(init?.body || "{}");
    const teamId = body.p_team_id;
    return new Response(JSON.stringify(rowsByTeam[teamId] || []), { status: 200 });
  };

  try {
    const teamACoachRequest = new Request("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-a&limit=10", {
      headers: { "x-user-id": "coach@team-a.test" },
    });
    const teamBCoachRequest = new Request("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-b&limit=10", {
      headers: { "x-user-id": "coach@team-b.test" },
    });

    const teamARes = await onRequestGet({ request: teamACoachRequest, env: ENV });
    const teamBRes = await onRequestGet({ request: teamBCoachRequest, env: ENV });
    assert.equal(teamARes.status, 200);
    assert.equal(teamBRes.status, 200);

    const teamAPayload = await teamARes.json();
    const teamBPayload = await teamBRes.json();

    assert.deepEqual(
      teamAPayload.leaderboard.map((r) => r.player_display_name),
      ["Ava", "Mia"],
    );
    assert.deepEqual(
      teamBPayload.leaderboard.map((r) => r.player_display_name),
      ["Noah", "Luca"],
    );
    assert.equal(teamAPayload.leaderboard.some((r) => r.player_display_name === "Noah"), false);
    assert.equal(teamBPayload.leaderboard.some((r) => r.player_display_name === "Ava"), false);

    const HomeShotsLeaderboardCard = loadCardComponent();
    const coachTeamAHtml = renderToStaticMarkup(
      React.createElement(HomeShotsLeaderboardCard, { status: "success", rows: teamAPayload.leaderboard, title: "TOP 10 HOME SHOTS" }),
    );

    assert.match(coachTeamAHtml, /AVA/);
    assert.match(coachTeamAHtml, /MIA/);
    assert.doesNotMatch(coachTeamAHtml, /NOAH/);
  } finally {
    global.fetch = originalFetch;
  }
});
