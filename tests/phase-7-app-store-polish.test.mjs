import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const header = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const styles = fs.readFileSync("src/components/DashboardIdentityHeader.module.css", "utf8");

test("Phase 7 exposes stable Player identity semantics", () => {
  for (const role of ["inner", "identity", "mode-row", "badge", "team-name", "name", "tagline", "mission", "brand-panel", "brand-mark"]) {
    assert.match(header, new RegExp(`data-identity-role=["']${role}["']`));
  }
});

test("Phase 7 compacts Player identity only away from Home", () => {
  assert.match(styles, /performance-shell--player\.is-mobile:not\(\[data-workspace-tab=\\?"home\\?"\]\)/);
  assert.match(styles, /min-height:92px!important/);
  assert.match(styles, /\.player \.tagline\{\s*display:none!important/);
  assert.match(styles, /\.player \.brandMark\{\s*width:58px!important/);
});

test("Phase 7 preserves a 44px accessible secondary return target", () => {
  assert.match(styles, /player-scroll-container>button\[type=\\?"button\\?"\]/);
  assert.match(styles, /width:44px!important/);
  assert.match(styles, /height:44px!important/);
  assert.match(styles, /content:\s*"‹"/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /display:none!important[^}]*player-scroll-container>button/);
});
