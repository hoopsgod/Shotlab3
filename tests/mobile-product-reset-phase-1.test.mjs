import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const coach = read("../src/components/CoachCommandCenter.jsx");
const coachCss = read("../src/styles/MissionControlHierarchy2026.css");
const playerHeader = read("../src/components/PlayerDashboardHeader.jsx");
const identityCss = read("../src/components/DashboardIdentityHeader.module.css");
const playerCommand = read("../src/components/PlayerDailyCommandCenter.jsx");
const playerCommandCss = read("../src/components/PlayerDailyCommandCenter.module.css");

test("Mobile Product Reset identifies the shared first-viewport surfaces", () => {
  assert.match(coach, /data-mobile-product-reset="phase-1"/);
  assert.match(playerHeader, /data-mobile-product-reset="phase-1"/);
  assert.match(playerCommand, /data-mobile-product-reset="phase-1"/);
});

test("Coach mobile identity uses a free-standing team mark inside the command header", () => {
  assert.match(coach, /className="mcHeaderTeamMark"/);
  assert.match(coach, /aria-label=\{`Customize \$\{teamName\} team identity`\}/);
  assert.match(coach, /MOBILE_PRODUCT_RESET_CSS/);
  assert.match(coachCss, /\.mcHeaderTeamMark/);
  assert.match(coach, /\.mcHeaderTeamMark img\{width:44px!important;height:44px!important\}/);
});

test("Mobile home hierarchy keeps readable type and one compact identity-to-command transition", () => {
  assert.match(playerHeader, /MOBILE_PRODUCT_RESET_CSS/);
  assert.match(playerHeader, /data-identity-role=\"inner\"\]\{[\s\S]*?min-height:84px!important/);
  assert.match(playerCommandCss, /Mobile Product Reset — Phase 1/);
  assert.match(playerCommandCss, /\.description \{[^}]*font-size: 15px;/);
  assert.match(coach, /MOBILE_PRODUCT_RESET_CSS/);
  assert.match(coach, /\.mcHeroContent>p\{[\s\S]*?font-size:14px!important/);
});

test("The reset remains presentation-only", () => {
  for (const source of [coachCss, identityCss, playerCommandCss]) {
    assert.doesNotMatch(source, /supabase|localStorage|sessionStorage|fetch\(/i);
  }
});
