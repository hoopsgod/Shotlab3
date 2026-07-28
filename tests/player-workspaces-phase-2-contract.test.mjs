import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("player workspaces expose focused At Home and Program command decks", async () => {
  const source = await read("src/components/PlayerTrainingWorkspaces.jsx");
  assert.match(source, /PlayerAtHomeWorkspace/);
  assert.match(source, /PlayerProgramWorkspace/);
  assert.match(source, /At Home Command Deck/);
  assert.match(source, /Program Execution Board/);
  assert.match(source, /PlayerMetricStrip/);
  assert.match(source, /PlayerOperationalList/);
  assert.match(source, /onOpenDrill/);
});

test("workspace integration is fail closed and enabled before React", async () => {
  const plugin = await read("scripts/playerWorkspacesPhase2VitePlugin.mjs");
  const vite = await read("vite.config.js");
  assert.match(plugin, /replaceRequired/);
  assert.match(plugin, /At Home legacy header/);
  assert.match(plugin, /Program legacy header/);
  assert.match(vite, /playerWorkspacesPhase2Plugin\(\), react\(\)/);
});

test("workspace styles preserve mobile and reduced-motion safety", async () => {
  const styles = await read("src/components/PlayerTrainingWorkspaces.module.css");
  assert.match(styles, /@media\(max-width:520px\)/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(styles, /min-height:64px/);
});
