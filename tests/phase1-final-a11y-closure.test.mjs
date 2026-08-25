import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const enhancer = fs.readFileSync(new URL("../src/lib/phase1EvidenceClosure.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/Phase1FinalA11yClosure.css", import.meta.url), "utf8");

test("Phase 1 roster closure reaches the actual nested roster rows", () => {
  assert.match(enhancer, /#coach-roster-operations/);
  assert.match(enhancer, /> \.fade-up > div\[role="button"\]/);
  assert.match(enhancer, /removeAttribute\("role"\)/);
  assert.match(enhancer, /removeAttribute\("tabindex"\)/);
});

test("final contrast corrections stay scoped to the evidence blockers", () => {
  assert.match(css, /\[data-testid="auth-workspace"\]/);
  assert.match(css, /\.auth-card-enter/);
  assert.match(css, /input::placeholder/);
  assert.match(css, /\.mcHealthFacts small/);
  assert.match(css, /\.teamIdentityTitleStage__action--primary/);
  assert.doesNotMatch(css, /(^|\n)\s*html\s*\{/);
  assert.doesNotMatch(css, /(^|\n)\s*body\s*\{/);
});
