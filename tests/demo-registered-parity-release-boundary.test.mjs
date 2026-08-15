import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

const liveWorkflow = await readFile(
  path.join(repoRoot, ".github/workflows/demo-registered-live-parity.yml"),
  "utf8",
);
const runtimeWorkflow = await readFile(
  path.join(repoRoot, ".github/workflows/demo-paid-runtime-parity.yml"),
  "utf8",
);
const parityContract = await readFile(
  path.join(repoRoot, "docs/demo-registered-parity-contract.md"),
  "utf8",
);

function pullRequestTriggerBlock(source) {
  const start = source.indexOf("on:\n");
  assert.notEqual(start, -1, "workflow must declare an on: block");
  const permissions = source.indexOf("\npermissions:", start);
  assert.notEqual(permissions, -1, "workflow must declare permissions after its trigger block");
  return source.slice(start, permissions);
}

test("live parity runs on every pull request without path-based escape hatches", () => {
  const triggers = pullRequestTriggerBlock(liveWorkflow);
  assert.match(triggers, /\bpull_request:\s*(?:\n|$)/);
  assert.doesNotMatch(
    triggers,
    /^\s+paths(?:-ignore)?:/m,
    "Demo Registered Live Parity must not be skipped because a visual change lives outside src/**",
  );
});

test("strict matched-data runtime parity also remains universal", () => {
  const triggers = pullRequestTriggerBlock(runtimeWorkflow);
  assert.match(triggers, /\bpull_request:\s*(?:\n|$)/);
  assert.doesNotMatch(triggers, /^\s+paths(?:-ignore)?:/m);
});

test("live parity certifies exact-head real hydration and paired mobile evidence", () => {
  assert.match(liveWorkflow, /ref:\s*\$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.match(liveWorkflow, /registered-mobile-post-auth-hydration\.spec\.mjs/);
  assert.match(liveWorkflow, /demo-registered-live-parity\.spec\.mjs/);
  assert.match(liveWorkflow, /Prove paired Demo and registered screenshot evidence is complete/);
  assert.match(liveWorkflow, /parity-evidence-manifest\.json/);
  assert.match(liveWorkflow, /390/);
  assert.match(liveWorkflow, /844/);
});

test("phase contract forbids demo-only visual certification", () => {
  assert.match(parityContract, /A visual phase cannot be certified from Demo screenshots alone\./);
  assert.match(parityContract, /same exact pull-request head/);
  assert.match(parityContract, /same built production bundle/);
  assert.match(parityContract, /real-backend hydration verification/);
  assert.match(parityContract, /must run for every pull request/);
});
