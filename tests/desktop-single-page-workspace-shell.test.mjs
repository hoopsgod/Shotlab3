import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile("src/App.jsx", "utf8");

test("desktop coach workspace has shareable route helpers", () => {
  assert.match(source, /function readCoachRoute\(/);
  assert.match(source, /function buildCoachRoute\(/);
  assert.match(source, /window\.history\.pushState\(\{shotlabWorkspace:"coach"/);
  assert.match(source, /window\.addEventListener\("popstate",onPopState\)/);
});

test("player intelligence opens on a real coach route and closes through browser history", () => {
  assert.match(source, /buildCoachRoute\("players",key\)/);
  assert.match(source, /window\.history\.pushState\(\{shotlabWorkspace:"coach-player"/);
  assert.match(source, /window\.location\.pathname\.includes\("\/coach\/players\/"/);
});

test("desktop navigation clears contextual player state without changing mobile routing", () => {
  assert.match(source, /setPlayerDrawerKey\("");setEditD\(null\);setSelP\(null\)/);
  assert.match(source, /const initialCoachRoute=readCoachRoute/);
});
