import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { transformSync } from "esbuild";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const cardFileUrl = new URL("../src/components/HomeShotsLeaderboardCard.jsx", import.meta.url);
const require = createRequire(import.meta.url);

function loadCardComponent() {
  const source = fs.readFileSync(cardFileUrl, "utf8");
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

test("coach landing page includes shared HomeShotsLeaderboardCard", () => {
  assert.match(appSource, /tab===\"feed\"[\s\S]*?<HomeShotsLeaderboardCard/);
});

test("player landing page includes shared HomeShotsLeaderboardCard", () => {
  assert.match(appSource, /tab===\"home\"[\s\S]*?<HomeShotsLeaderboardCard/);
});

test("home shots leaderboard includes players/coaches scope toggle", () => {
  assert.match(appSource, /HOME_SHOTS_LEADERBOARD_SCOPES/);
  assert.match(appSource, /scopeOption\.label/);
  assert.match(appSource, /COACHES/);
});

test("leaderboard card renders loading, empty, and error states", () => {
  const HomeShotsLeaderboardCard = loadCardComponent();
  const loadingHtml = renderToStaticMarkup(React.createElement(HomeShotsLeaderboardCard, { status: "loading", rows: [] }));
  const emptyHtml = renderToStaticMarkup(React.createElement(HomeShotsLeaderboardCard, { status: "success", rows: [] }));
  const errorHtml = renderToStaticMarkup(React.createElement(HomeShotsLeaderboardCard, { status: "error", rows: [], error: "boom" }));

  assert.match(loadingHtml, /Rank 1–10/);
  assert.match(emptyHtml, /No home shots logged yet\./);
  assert.match(errorHtml, /Could not load leaderboard/);
  assert.match(errorHtml, /boom/);
});

test("leaderboard card renders backend-provided order and rank labels without client-side sorting", () => {
  const HomeShotsLeaderboardCard = loadCardComponent();
  const rows = [
    { rank: 1, player_display_name: "Zoe", total_home_shots: 300 },
    { rank: 2, player_display_name: "Ava", total_home_shots: 300 },
  ];

  const html = renderToStaticMarkup(
    React.createElement(HomeShotsLeaderboardCard, {
      status: "success",
      rows,
      title: "TOP 10 HOME SHOTS",
    }),
  );

  assert.ok(html.indexOf("ZOE") < html.indexOf("AVA"));
  assert.match(html, /#1/);
  assert.match(html, /#2/);
  assert.doesNotMatch(fs.readFileSync(cardFileUrl, "utf8"), /rows\.sort\(/);
});
