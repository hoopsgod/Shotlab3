import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const enhancer = fs.readFileSync(new URL("../src/lib/phase1EvidenceClosure.js", import.meta.url), "utf8");

test("Phase 1 roster closure reaches the actual nested roster rows", () => {
  assert.match(enhancer, /#coach-roster-operations/);
  assert.match(enhancer, /> \.fade-up > div\[role="button"\]/);
  assert.match(enhancer, /classList\.add\("phase1RosterRow"\)/);
  assert.match(enhancer, /removeAttribute\("role"\)/);
  assert.match(enhancer, /removeAttribute\("tabindex"\)/);
});

test("explicit roster profile actions carry the actual player name instead of a repeated generic label", () => {
  assert.match(enhancer, /row\.children\?\.\[1\]\?\.children\?\.\[1\]/);
  assert.match(enhancer, /details\?\.querySelector\?\.\("span"\)/);
  assert.match(enhancer, /`Open \$\{name\} profile`/);
  assert.match(enhancer, /data-phase1-open-profile/);
});

test("final contrast corrections remain inside the existing evidence bridge", () => {
  assert.match(enhancer, /phase1-final-a11y/);
  assert.match(enhancer, /\[data-testid=\\?"auth-workspace/);
  assert.match(enhancer, /input::placeholder/);
  assert.match(enhancer, /\.mcHealthFacts small/);
  assert.match(enhancer, /\.teamIdentityTitleStage__action--primary/);
  assert.match(enhancer, /animation:none!important/);
  assert.doesNotMatch(enhancer, /Phase1FinalA11yClosure\.css/);
});
