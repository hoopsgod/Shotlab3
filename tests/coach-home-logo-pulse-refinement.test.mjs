import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Focused contracts for the approved Coach Home logo and Program Pulse refinement.
const phase1Closure = fs.readFileSync(new URL("../src/lib/phase1EvidenceClosure.js", import.meta.url), "utf8");
const coachFinalCss = fs.readFileSync(new URL("../src/components/CoachMissionControlFinal.css", import.meta.url), "utf8");

test("Coach Home production mobile parity uses the Player Home hero crest scale", () => {
  assert.match(phase1Closure, /--coach-hero-crest:clamp\(104px,29vw,120px\)!important/);
  assert.doesNotMatch(phase1Closure, /--coach-hero-crest:clamp\(80px,21vw,92px\)!important/);
});

test("Program Pulse percentage stays subordinate and responsive on narrow Coach Home layouts", () => {
  assert.match(coachFinalCss, /\.mcHealthScore\{[^}]*font:820 clamp\(36px,10vw,44px\)\/\.9 var\(--mc-native\)/);
  assert.doesNotMatch(coachFinalCss, /\.mcHealthScore\{[^}]*font:820 (?:54px|44px)\/\.86 var\(--mc-native\)/);
});
