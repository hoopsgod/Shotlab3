import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  RUNTIME_STORAGE_KEYS,
  clearStaleDemoSession,
  getAutoSyncShotLogs,
  isDemoRuntimeEnabled,
  isSessionAuthError,
  syncPendingHomeShotLogs,
} from "../src/lib/runtimeReleaseReadiness.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    storage: {
      async get(key) {
        return { value: values.has(key) ? values.get(key) : null };
      },
      async set(key, value) {
        values.set(key, value);
        return { value };
      },
    },
    localStorage: {
      getItem(key) {
        return values.has(key) ? values.get(key) : null;
      },
      setItem(key, value) {
        values.set(key, value);
      },
      removeItem(key) {
        values.delete(key);
      },
    },
  };
}

const pendingLog = {
  id: "shot-1",
  teamId: "team-1",
  playerId: "player@example.com",
  email: "player@example.com",
  name: "Player One",
  made: 125,
  date: "2026-07-27",
  ts: 12345,
  syncState: "local_pending",
  syncSource: "local",
};

test("production demo access is isolated to approved sales previews, explicit opt-in, and local development", () => {
  assert.equal(isDemoRuntimeEnabled({ env: { DEV: false }, location: { hostname: "shotlab.app" } }), false);
  assert.equal(isDemoRuntimeEnabled({ env: { DEV: false, VITE_ENABLE_DEMO_MODE: "true" }, location: { hostname: "shotlab.app" } }), true);
  assert.equal(isDemoRuntimeEnabled({ env: { DEV: false }, location: { hostname: "localhost" } }), true);
  assert.equal(isDemoRuntimeEnabled({ env: { DEV: false }, location: { hostname: "shotlab3.pages.dev" } }), true);
  assert.equal(isDemoRuntimeEnabled({ env: { DEV: false }, location: { hostname: "8a15c60d.shotlab3.pages.dev" } }), true);
  assert.equal(isDemoRuntimeEnabled({ env: { DEV: false }, location: { hostname: "unrelated.pages.dev" } }), false);
});

test("stale demo sessions are removed from a production runtime", async () => {
  const state = createStorage({
    [RUNTIME_STORAGE_KEYS.appSession]: JSON.stringify({ email: "demo@shotlab.app" }),
    [RUNTIME_STORAGE_KEYS.demoMode]: "true",
    "sl:supabase-session": JSON.stringify({ access_token: "secret" }),
    "sl:supabase-access-token": "secret",
  });

  const cleared = await clearStaleDemoSession({
    env: { DEV: false, VITE_ENABLE_DEMO_MODE: "false" },
    location: { hostname: "shotlab.app" },
    storage: state.storage,
    localStorage: state.localStorage,
  });

  assert.equal(cleared, true);
  assert.equal(JSON.parse(state.values.get(RUNTIME_STORAGE_KEYS.appSession)), null);
  assert.equal(state.values.has(RUNTIME_STORAGE_KEYS.demoMode), false);
  assert.equal(state.values.has("sl:supabase-session"), false);
  assert.equal(state.values.has("sl:supabase-access-token"), false);
});

test("automatic shot recovery only selects safe pending rows for the authenticated player", () => {
  const rows = [
    pendingLog,
    { ...pendingLog, id: "shot-2", email: "other@example.com", playerId: "other@example.com" },
    { ...pendingLog, id: "shot-3", syncState: "failed_sync" },
    { ...pendingLog, id: "shot-4", demo: true },
    { ...pendingLog, id: "shot-5", syncState: "remote_saved" },
  ];

  assert.deepEqual(getAutoSyncShotLogs(rows, "player@example.com").map((row) => row.id), ["shot-1"]);
});

test("pending home shots sync to the team endpoint and become remote-confirmed", async () => {
  const state = createStorage({
    [RUNTIME_STORAGE_KEYS.shotLogs]: JSON.stringify([pendingLog]),
  });
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options, body: JSON.parse(options.body) });
    return {
      ok: true,
      status: 200,
      async json() {
        return { shot_log: { id: "remote-shot-1", team_id: "team-1", player_id: "player@example.com", email: "player@example.com", made: 125, date: "2026-07-27", ts: 12345 } };
      },
    };
  };

  const result = await syncPendingHomeShotLogs({
    authEmail: "player@example.com",
    fetchImpl,
    storage: state.storage,
    localStorage: state.localStorage,
  });

  assert.equal(result.ok, true);
  assert.equal(result.synced, 1);
  assert.equal(result.pending, 0);
  assert.equal(requests[0].url, "/v1/home-shots/log");
  assert.equal(requests[0].options.headers["x-user-id"], "player@example.com");
  assert.equal(requests[0].body.team_id, "team-1");
  const saved = JSON.parse(state.values.get(RUNTIME_STORAGE_KEYS.shotLogs));
  assert.equal(saved[0].id, "remote-shot-1");
  assert.equal(saved[0].syncState, "remote_saved");
  assert.equal(saved[0].syncSource, "remote");
});

test("authentication failures preserve pending data and request session recovery", async () => {
  const state = createStorage({
    [RUNTIME_STORAGE_KEYS.shotLogs]: JSON.stringify([pendingLog]),
  });
  const result = await syncPendingHomeShotLogs({
    authEmail: "player@example.com",
    storage: state.storage,
    localStorage: state.localStorage,
    fetchImpl: async () => ({ ok: false, status: 401, async json() { return { error: "unauthorized" }; } }),
  });

  assert.equal(result.requiresAuth, true);
  assert.equal(result.synced, 0);
  assert.equal(result.pending, 1);
  assert.equal(JSON.parse(state.values.get(RUNTIME_STORAGE_KEYS.shotLogs))[0].syncState, "local_pending");
});

test("session error classifier covers refresh and invalid-session outcomes", () => {
  assert.equal(isSessionAuthError({ code: "session_refresh_failed" }), true);
  assert.equal(isSessionAuthError({ code: "session_invalid" }), true);
  assert.equal(isSessionAuthError({ code: "network_error" }), false);
});

test("startup shell mounts the release boundary and gates demo bootstrap", async () => {
  const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
  assert.match(main, /<ReleaseReadinessBoundary>/);
  assert.match(main, /if \(DEMO_RUNTIME_ENABLED\) \{\s*demoBootstrap\(\)/);
  assert.match(main, /markBoot\('demo_bootstrap', 'skipped'\)/);
  assert.match(main, /const DEMO_RUNTIME_ENABLED = isDemoRuntimeEnabled\(\)/);
});

test("release boundary monitors network and session lifecycle with accessible status", async () => {
  const boundary = await readFile(new URL("../src/components/ReleaseReadinessBoundary.jsx", import.meta.url), "utf8");
  assert.match(boundary, /addEventListener\("offline"/);
  assert.match(boundary, /addEventListener\("online"/);
  assert.match(boundary, /visibilitychange/);
  assert.match(boundary, /onAuthStateChange/);
  assert.match(boundary, /SIGNED_OUT/);
  assert.match(boundary, /role="status"/);
  assert.match(boundary, /role="alert"/);
  assert.match(boundary, /auth-demo-enter/);
  assert.match(boundary, /LOAD DEMO DATA/);
});
