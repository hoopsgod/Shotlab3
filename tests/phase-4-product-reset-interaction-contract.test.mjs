import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared controls expose premium mobile touch, working, focus, and reduced-motion states", async () => {
  const source = await read("src/components/ui/designSystem.jsx");
  const css = await read("src/components/ui/designSystem.css");

  assert.match(source, /minHeight:\s*44/);
  assert.match(source, /loading\s*=\s*false/);
  assert.match(source, /loadingLabel = "Working"/);
  assert.match(source, /aria-busy=\{loading \|\| undefined\}/);
  assert.match(source, /data-working=\{loading \? "true" : undefined\}/);
  assert.match(source, /disabled=\{isDisabled\}/);
  assert.match(source, /className="ds-skeleton-line"/);
  assert.match(source, /aria-busy="true"/);

  assert.match(css, /ds-button/);
  assert.match(css, /:active:not\(:disabled\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /:disabled/);
  assert.match(css, /touch-action:\s*manipulation/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /bounce|glow.*infinite/i);
});

test("shared state actions acknowledge pending work without allowing duplicate actions", async () => {
  const source = await read("src/components/ShotLabStatePanel.jsx");
  const css = await read("src/components/ShotLabStatePanel.module.css");

  assert.match(source, /actionPending = false/);
  assert.match(source, /actionPendingLabel = "Working"/);
  assert.match(source, /disabled=\{actionPending\}/);
  assert.match(source, /aria-busy=\{actionPending \|\| undefined\}/);
  assert.match(source, /data-working=\{actionPending \? "true" : undefined\}/);
  assert.match(source, /actionPending \? actionPendingLabel : actionLabel/);
  assert.match(css, /\.action:disabled/);
  assert.match(css, /\.action:active:not\(:disabled\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("authentication is single-flight, reports working state, and shields technical failures", async () => {
  const source = await read("src/components/AuthWorkspace.jsx");

  assert.match(source, /useRef, useState/);
  assert.match(source, /busyRef\.current/);
  assert.match(source, /if\(busyRef\.current\)return false/);
  assert.match(source, /aria-busy=\{Boolean\(busyAction\)\|\|undefined\}/);
  assert.match(source, /disabled=\{Boolean\(busyAction\)\}/);
  assert.match(source, /data-working=\{primaryBusy\?"true":undefined\}/);
  assert.match(source, /friendlyAuthError/);
  assert.match(source, /technicalAuthErrorPattern/);
  assert.match(source, /role="status" aria-live="polite"/);
  assert.match(source, /role="alert" aria-live="assertive"/);
  assert.match(source, /minHeight:44/);
  assert.doesNotMatch(source, /setErr\(r\.err\)/);
  assert.doesNotMatch(source, /setErr\(demo\.err/);
});

test("coach player provisioning uses mobile-native inputs, semantic submission, and safe user-facing failures", async () => {
  const source = await read("src/components/CoachPlayerInviteForm.jsx");

  assert.match(source, /<form[^>]+aria-busy=\{busy \|\| undefined\}[^>]+onSubmit=\{submit\}/);
  assert.match(source, /if \(busy\) return/);
  assert.match(source, /loading=\{busy\}/);
  assert.match(source, /loadingLabel="Sending invite"/);
  assert.match(source, /type="email"/);
  assert.match(source, /inputMode="email"/);
  assert.match(source, /autoComplete="email"/);
  assert.match(source, /inputMode="numeric"/);
  assert.match(source, /pattern="\[0-9\]\*"/);
  assert.match(source, /friendlyPlayerInviteError/);
  assert.match(source, /technicalErrorPattern/);
  assert.match(source, /role="alert" aria-live="assertive"/);
  assert.doesNotMatch(source, /setError\(result\.error\)/);
});

test("Coach Program score logging is single-flight, thumb-safe, and shields technical failures", async () => {
  const source = await read("src/components/CoachProgramScoreDrawer.jsx");
  const css = await read("src/components/CoachProgramScoreDrawer.module.css");

  assert.match(source, /if \(saving\) return/);
  assert.match(source, /aria-busy=\{saving \|\| undefined\}/);
  assert.match(source, /data-working=\{saving \? "true" : undefined\}/);
  assert.match(source, /Saving verified result/);
  assert.match(source, /friendlyProgramScoreError/);
  assert.match(source, /catch \(caught\)/);
  assert.match(source, /role="alert" aria-live="assertive"/);
  assert.doesNotMatch(source, /setError\(result\?\.error \|\| result\?\.err\?\.message/);
  assert.match(css, /height:\s*44px/);
  assert.match(css, /width:\s*44px/);
  assert.match(css, /\.submit:active:not\(:disabled\)/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("new-season creation uses a designed working, error, and retry contract", async () => {
  const source = await read("src/components/NewSeasonWizard.jsx");

  assert.match(source, /if \(status\.state === "saving"\) return/);
  assert.match(source, /friendlySeasonCreationError/);
  assert.match(source, /catch \(caught\)/);
  assert.match(source, /aria-busy=\{isSaving \|\| undefined\}/);
  assert.match(source, /data-working=\{isSaving \? "true" : undefined\}/);
  assert.match(source, /role=\{status\.state === "error" \? "alert" : "status"\}/);
  assert.match(source, /Reset attempt/);
  assert.doesNotMatch(source, /message:\s*result\?\.error \|\|/);
});

test("roster controls do not fake latency and preserve 44px filter targets", async () => {
  const source = await read("src/screens/PlayersScreen.jsx");

  assert.doesNotMatch(source, /isBootstrapping/);
  assert.doesNotMatch(source, /setTimeout\(\(\) => setIsBootstrapping/);
  assert.doesNotMatch(source, /minHeight:\s*38/);
  assert.match(source, /type="search"/);
  assert.match(source, /aria-label="Search players"/);
});

test("Phase 4 remains component-owned instead of introducing a new global visual authority", async () => {
  const main = await read("src/main.jsx");
  assert.doesNotMatch(main, /Phase4.*\.css|phase-4.*\.css/i);
  const sharedCss = await read("src/components/ui/designSystem.css");
  assert.doesNotMatch(sharedCss, /(^|\n)\s*(html|body|:root|\*)\s*\{/m);
});
