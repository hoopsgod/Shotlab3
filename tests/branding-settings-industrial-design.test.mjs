import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const screen = fs.readFileSync("src/screens/CoachTeamBrandingScreen.jsx", "utf8");
const preview = fs.readFileSync("src/components/team/TeamBrandingPreview.jsx", "utf8");
const styles = fs.readFileSync("src/screens/CoachTeamBrandingScreen.css", "utf8");

test("branding screen uses a cohesive identity workspace", () => {
  assert.match(screen, /branding-industrial__workspace/);
  assert.match(screen, /Identity controls/);
  assert.match(screen, /Shared preview/);
  assert.match(screen, /TeamBrandingForm/);
  assert.match(screen, /TeamBrandingPreview/);
});

test("live preview shows distinct coach and player product surfaces", () => {
  assert.match(preview, /Mission Control/);
  assert.match(preview, /Today’s Training/);
  assert.match(preview, /data-testid="branding-live-preview"/);
  assert.match(preview, /Typography ·/);
});

test("branding workspace follows warm light tokens and accessibility rules", () => {
  assert.match(styles, /#f5f3ee/);
  assert.match(styles, /rgba\(255,255,255,.94\)/);
  assert.match(styles, /min-height:48px!important/);
  assert.match(styles, /focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /max-width:860px/);
});

test("branding presentation adds no persistence or network behavior", () => {
  const source = `${screen}\n${preview}\n${styles}`;
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|supabase|\.insert\(|\.update\(/);
});
