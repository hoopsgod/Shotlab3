import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
