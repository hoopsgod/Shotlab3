import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const doc = fs.readFileSync("docs/player-first-result-conversion.md", "utf8");

test("release note preserves the bounded conversion contract", () => {
  assert.match(doc, /Urgent team commitments remain first/);
  assert.match(doc, /one direct first-result task/);
  assert.match(doc, /full daily target is not presented as the activation requirement/);
  assert.match(doc, /No authentication, schema, persistence, roster, Team Store, or coach workflow changes/);
});