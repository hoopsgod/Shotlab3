import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const screen = fs.readFileSync("src/screens/CoachTeamBrandingScreen.jsx", "utf8");
const preview = fs.readFileSync("src/components/team/TeamBrandingPreview.jsx", "utf8");
const styles = fs.readFileSync("src/screens/CoachTeamBrandingScreen.css", "utf8");

test("branding screen leads with program identity while retaining controls", () => {
  assert.match(screen, /branding-industrial__workspace/);
  assert.match(screen, /Program identity/);
  assert.match(screen, /Refine the system/);
  assert.match(screen, /TeamBrandingForm/);
  assert.match(screen, /TeamBrandingPreview/);
  assert.ok(screen.indexOf('data-visual-role="branding-preview"') < screen.indexOf('data-visual-role="branding-controls"'));
});

test("live preview shows distinct coach and player product surfaces", () => {
  assert.match(preview, /Mission Control/);
  assert.match(preview, /Today’s Training/);
  assert.match(preview, /data-testid="branding-live-preview"/);
  assert.match(preview, /Typography ·/);
});

test("branding workspace gives identity the dominant surface and subordinates controls", () => {
  assert.match(styles, /#f5f3ee/);
  assert.match(styles, /linear-gradient\(145deg,#0a2633/);
  assert.match(styles, /branding-industrial__controls\{width:min\(100%,820px\)/);
  assert.match(styles, /min-height:48px!important/);
  assert.match(styles, /focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("branding presentation adds no persistence or network behavior", () => {
  const source = `${screen}\n${preview}\n${styles}`;
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|supabase|\.insert\(|\.update\(/);
});
