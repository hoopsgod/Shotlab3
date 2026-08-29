import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mediaBlock } from "./helpers/css-contract.mjs";

const shellCss = fs.readFileSync(new URL("../src/components/CoachMissionControlShell.css", import.meta.url), "utf8");

test("Coach Home permanent navigation rail stays desktop-only", () => {
  const desktop = mediaBlock(shellCss, "(min-width:981px)");
  const mobileAndTablet = mediaBlock(shellCss, "(max-width:980px)");

  assert.match(
    desktop,
    /\.app-shell\.is-desktop \.mcShellV3>\.mcRail\{display:flex!important/,
    "desktop Coach Home should retain the permanent rail",
  );
  assert.match(
    mobileAndTablet,
    /body\.mission-control-active \.mcShellV3>\.mcRail\{display:none!important\}/,
    "the desktop Coach rail must never re-enter mobile or tablet document flow",
  );
});
