import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync(new URL("../src/components/PlayerCareerHistory.jsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../src/components/PlayerCareerHistory.module.css", import.meta.url), "utf8");

test("career history presents athlete identity before statistics", () => {
  assert.match(component, /Athlete profile/);
  assert.match(component, /identityMark/);
  assert.match(component, /Career makes/);
  assert.match(component, /Career bests/);
  assert.match(component, /Career timeline/);
});

test("career history preserves trusted metrics and archive behavior", () => {
  assert.match(component, /data-testid="career-improvement"/);
  assert.match(component, /data-testid="career-season-list"/);
  assert.match(component, /onOpenArchive\(season\.archiveId\)/);
  assert.match(component, /Shooting/);
  assert.match(component, /Home/);
  assert.match(component, /Program/);
});

test("career history uses the light industrial design and accessible controls", () => {
  assert.match(styles, /background:#fff/);
  assert.match(styles, /min-height:44px/);
  assert.match(styles, /focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /@media\(max-width:430px\)/);
});

test("career design introduces no persistence or network writes", () => {
  assert.doesNotMatch(component, /fetch\(|localStorage|storage\.set|supabase|axios/);
});
