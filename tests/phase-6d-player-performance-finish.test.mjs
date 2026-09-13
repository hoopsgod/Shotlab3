import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Phase 6D removes nested Player workspace state chrome without hiding the state panel", async () => {
  const css = await read("src/styles/AuthenticatedVisualAuthority2026.css");
  const workspace = await read("src/components/PlayerOperationalWorkspace.jsx");

  assert.match(workspace, /data-testid="player-workspace-state-shell"/);
  assert.match(workspace, /testId="player-workspace-empty-state"/);
  assert.match(css, /\[data-testid="player-workspace-state-shell"\][\s\S]*?padding:\s*0\s*!important;[\s\S]*?border:\s*0\s*!important;[\s\S]*?background:\s*transparent\s*!important;/);
  assert.match(css, /\[data-testid="player-workspace-state-shell"\]\s*>\s*\[data-testid="player-workspace-empty-state"\][\s\S]*?width:\s*100%\s*!important;/);
});

test("Phase 6D turns Progress support signals into editorial evidence instead of equal cards", async () => {
  const css = await read("src/styles/AuthenticatedVisualAuthority2026.css");
  const progress = await read("src/components/PlayerProgressStory.jsx");

  assert.match(progress, /data-testid="player-progress-strongest-signal"/);
  assert.match(progress, /data-testid="player-progress-opportunity"/);
  assert.match(css, /\[data-testid="player-progress-strongest-signal"\],[\s\S]*?\[data-testid="player-progress-opportunity"\][\s\S]*?border-radius:\s*0\s*!important;[\s\S]*?background:\s*transparent\s*!important;[\s\S]*?box-shadow:\s*none\s*!important;/);
  assert.match(css, /@media\s*\(min-width:\s*621px\)[\s\S]*?\[data-testid="player-progress-opportunity"\][\s\S]*?border-left:\s*1px\s+solid/);
});

test("Phase 6D keeps one compact Player action geometry family", async () => {
  const css = await read("src/styles/AuthenticatedVisualAuthority2026.css");
  const home = await read("src/components/PlayerDailyCommandCenter.jsx");
  const progress = await read("src/components/PlayerProgressStory.jsx");

  assert.match(home, /data-testid="player-daily-primary-action"/);
  assert.match(progress, /data-testid="player-progress-start-focus"/);
  assert.match(css, /\[data-testid="player-daily-primary-action"\],[\s\S]*?\[data-testid="player-progress-start-focus"\],[\s\S]*?border-radius:\s*10px\s*!important;/);
  assert.match(css, /\[data-testid="player-activation-loop"\][\s\S]*?border-inline:\s*0\s*!important;[\s\S]*?border-radius:\s*0\s*!important;[\s\S]*?background:\s*transparent\s*!important;/);
});
