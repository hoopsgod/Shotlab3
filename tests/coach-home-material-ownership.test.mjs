import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const finalCss = fs.readFileSync(new URL("../src/components/CoachMissionControlFinal.css", import.meta.url), "utf8");
const titleCss = fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css", import.meta.url), "utf8");
const shellCss = fs.readFileSync(new URL("../src/components/CoachMissionControlShell.css", import.meta.url), "utf8");
const phase1Closure = fs.readFileSync(new URL("../src/lib/phase1EvidenceClosure.js", import.meta.url), "utf8");

const sectionRule = finalCss.match(/\.mcShellV3 \.mcSection\{([^}]*)\}/)?.[1] || "";

test("Coach Home section primitive does not reclaim route-owned material", () => {
  assert.ok(sectionRule, "expected Coach Home section primitive rule");
  assert.doesNotMatch(sectionRule, /\bbackground\s*:/);
  assert.doesNotMatch(sectionRule, /\bcolor\s*:/);
  assert.doesNotMatch(sectionRule, /!important/);
});

test("Program Pulse material remains owned by the canonical title-stage layer", () => {
  assert.match(titleCss, /\.mcShellV3 \.mcTeamHealth\{[^}]*background:linear-gradient\(150deg,#0b2231,var\(--team-brand-surface-deep,#06151d\)\)[^}]*color:#f4f7f8/);
  assert.match(titleCss, /@media\(max-width:700px\)[\s\S]*?\.mcShellV3\.is-mobile-shell \.mcTeamHealth\{[^}]*background:linear-gradient\(180deg,var\(--team-brand-surface-deep,#06151d\),#0a202e\)[^}]*color:#f4f7f8/);
});


test("Coach Home mobile hero has one component visual authority", () => {
  const authorityStart = titleCss.indexOf("/* Phase 6E mobile Coach Home composition authority");
  const authorityEnd = titleCss.indexOf("@media(prefers-reduced-motion:reduce)", authorityStart);
  const mobileAuthority = authorityStart >= 0 && authorityEnd > authorityStart
    ? titleCss.slice(authorityStart, authorityEnd)
    : "";
  assert.match(mobileAuthority, /mcHeader\[data-testid="mission-control-team-header"\]\{display:none\}/);
  assert.match(mobileAuthority, /--coach-hero-crest:clamp\(104px,29vw,120px\)/);
  assert.match(mobileAuthority, /font-size:clamp\(36px,9\.4vw,40px\)/);
  assert.doesNotMatch(shellCss, /Coach Home has one mobile identity stage|mcHeroTeamMark\{width:88px/);
  assert.doesNotMatch(phase1Closure, /coach-mobile-production-parity|mcHeroTeamMark|--coach-hero-crest/);
});
