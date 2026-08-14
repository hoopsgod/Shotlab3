import test from "node:test";
import assert from "node:assert/strict";
import { applyDemoData, buildDemoDataBundle, clearDemoData } from "../src/lib/demoData.js";

class MemoryStorage {
  constructor(seed = {}) { this.values = new Map(Object.entries(seed)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
  key(index) { return [...this.values.keys()][index] ?? null; }
  get length() { return this.values.size; }
}

const rows = (storage, key) => JSON.parse(storage.getItem(key) || "[]");

async function withBrowserStorage(seed, run) {
  const localStorage = new MemoryStorage(Object.fromEntries(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)])));
  const managed = new Map();
  const priorWindow = globalThis.window;
  globalThis.window = {
    localStorage,
    storage: {
      async get(key) { return managed.has(key) ? { value: managed.get(key) } : null; },
      async set(key, value) { managed.set(key, value); },
    },
  };
  try {
    await run(localStorage);
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
}

test("demo reset replaces only demo-owned rows and preserves another tenant", async () => {
  const realTeam = { id: "team-real-1", name: "Real Team" };
  const realPlayer = { id: "player-real-1", email: "real.player@example.com", teamId: realTeam.id };
  const realEvent = { id: "event-real-1", title: "Real Practice", teamId: realTeam.id };
  const realScore = { id: "score-real-1", email: realPlayer.email, teamId: realTeam.id, score: 17 };
  const realShot = { id: "shot-real-1", email: realPlayer.email, teamId: realTeam.id, made: 88 };
  const seed = {
    "sl:teams": [realTeam],
    "sl:players": [realPlayer],
    "sl:player-profiles": [],
    "sl:events": [realEvent],
    "sl:rsvps": [],
    "sl:scores": [realScore],
    "sl:shotlogs": [realShot],
    "sl:progress-snapshots": [],
  };

  await withBrowserStorage(seed, async (storage) => {
    const bundle = buildDemoDataBundle({ coachEmail: "coach.demo@shotlab.app" });
    await applyDemoData(bundle);

    assert.ok(rows(storage, "sl:teams").some((row) => row.id === realTeam.id));
    assert.ok(rows(storage, "sl:teams").some((row) => row.id === "team-demo-titans"));

    const mutatedDemoPlayers = rows(storage, "sl:players").map((row) => row.teamId === "team-demo-titans" ? { ...row, name: "Corrupted Demo" } : row);
    storage.setItem("sl:players", JSON.stringify(mutatedDemoPlayers));
    await applyDemoData(bundle);
    assert.ok(rows(storage, "sl:players").some((row) => row.id === realPlayer.id && row.email === realPlayer.email));
    assert.ok(rows(storage, "sl:players").some((row) => row.teamId === "team-demo-titans" && row.name !== "Corrupted Demo"));

    await clearDemoData(bundle);
    assert.deepEqual(rows(storage, "sl:teams"), [realTeam]);
    assert.deepEqual(rows(storage, "sl:players"), [realPlayer]);
    assert.deepEqual(rows(storage, "sl:events"), [realEvent]);
    assert.deepEqual(rows(storage, "sl:scores"), [realScore]);
    assert.deepEqual(rows(storage, "sl:shotlogs"), [realShot]);
    assert.deepEqual(JSON.parse(storage.getItem("sl:demo-data-meta") || "{}"), {});
  });
});

test("demo cleanup cannot delete a real row even when storage contains both tenants", async () => {
  const realRows = [
    { id: "real-event", teamId: "team-real-2", title: "Keep me" },
    { id: "demo-event", teamId: "team-demo-titans", title: "Remove me" },
  ];
  await withBrowserStorage({ "sl:events": realRows }, async (storage) => {
    const bundle = buildDemoDataBundle({ coachEmail: "coach.demo@shotlab.app" });
    await clearDemoData(bundle);
    assert.deepEqual(rows(storage, "sl:events"), [realRows[0]]);
  });
});
