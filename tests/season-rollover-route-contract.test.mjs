import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { onRequestGet, onRequestPost } from "../functions/v1/seasons/index.js";

const source = await readFile(new URL("../functions/v1/seasons/index.js", import.meta.url), "utf8");

test("season route has authenticated GET and POST handlers", () => {
  assert.match(source, /export async function onRequestGet/);
  assert.match(source, /export async function onRequestPost/);
  assert.match(source, /if \(!requester\).*status: 401/s);
});

test("season route rejects malformed plans before the RPC", () => {
  const validationIndex = source.indexOf("const validated = validatePlan");
  const rpcIndex = source.indexOf('callRpc(env, "start_new_season"');
  assert.ok(validationIndex >= 0);
  assert.ok(rpcIndex > validationIndex);
  assert.match(source, /invalid_player_identity/);
  assert.match(source, /plan_too_large/);
});

test("season route maps expected authorization and conflict failures", () => {
  assert.match(source, /status: 403/);
  assert.match(source, /status: 409/);
  assert.match(source, /status: 404/);
  assert.match(source, /status: 429/);
});

test("production season route rejects a spoofed identity header", async () => {
  const response = await onRequestGet({
    request: new Request("https://shotlab3.pages.dev/v1/seasons", {
      headers: { "x-user-id": "coach@example.com" },
    }),
    env: {},
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "unauthorized");
});

test("demo season rollover remains local and creates no database request", async () => {
  const response = await onRequestPost({
    request: new Request("https://shotlab3.pages.dev/v1/seasons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "coach.demo@shotlab.app",
      },
      body: JSON.stringify({
        plan: {
          transitionId: "demo-transition",
          activeSeason: {
            teamId: "demo-team",
            sourceArchiveId: "demo-archive",
            name: "Demo Season",
            startDate: "2026-08-01",
            projectedEndDate: "2027-02-28",
          },
          returningMemberships: [],
        },
      }),
    }),
    env: {},
  });
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.demoLocalOnly, true);
  assert.equal(payload.seasonId, "demo-season-demo-transition");
});
