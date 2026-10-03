import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mediaBlock } from "./helpers/css-contract.mjs";

const shellCss = fs.readFileSync(new URL("../src/components/CoachMissionControlShell.css", import.meta.url), "utf8");

test("Coach Home permanent navigation rail stays desktop-only", () => {
  const desktop = mediaBlock(fs.readFileSync(new URL("../src/styles/DesktopHudlWorkspace2026.css", import.meta.url), "utf8"), "(min-width:1024px)");
  const mobileAndTablet = mediaBlock(shellCss, "(max-width:1023px)");

  assert.match(
    desktop,
    /\.workspaceRail \{[^}]*position:sticky;[^}]*height:100dvh;[^}]*display:flex;/,
    "desktop Coach Home should retain the permanent rail",
  );
  assert.match(
    mobileAndTablet,
    /body\.mission-control-active \.mcShellV3>\.mcRail\{display:none!important\}/,
    "the desktop Coach rail must never re-enter mobile or tablet document flow",
  );
});
