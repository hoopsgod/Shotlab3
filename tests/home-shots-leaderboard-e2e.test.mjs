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
