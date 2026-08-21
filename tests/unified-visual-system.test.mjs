import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const css = readFileSync("public/shotlab-v15-session-integrity.css", "utf8");
const activationCss = readFileSync("src/components/CoachActivationPath.css", "utf8");

test("one final stylesheet owns Coach and Player visual parity", () => {
  assert.equal(existsSync("public/shotlab-v16-unified-visual-system.css"), false);
  assert.equal(existsSync("public/shotlab-v17-screen-consistency.css"), false);
  assert.match(css, /consolidated Coach and Player visual authority/);
  assert.match(css, /\[data-role="coach"\],\[data-role="player"\]/);
});

test("shared tokens cover surfaces, controls, contrast, and spacing", () => {
  for (const token of ["--sl-ink","--sl-muted","--sl-surface","--sl-border","--sl-accent","--sl-radius-card","--sl-radius-control","--sl-shadow-card"]) {
    assert.ok(css.includes(token), `missing ${token}`);
  }
});

test("dark operational cards preserve readable text contrast", () => {
  assert.match(css, /color:#f7f8f5!important/);
  assert.match(css, /color:#b8c0ba!important/);
});

test("forms, accountability, and secondary pages share one contract", () => {
  for (const contract of ["assignment-accountability","player-detail","career","archive","event","settings","legal","data-request"]) {
    assert.ok(css.includes(contract), `missing ${contract}`);
  }
  assert.match(css, /min-height:52px!important/);
  assert.match(css, /outline:3px solid rgba\(120,149,31,.18\)/);
});

test("mobile Mission Control and onboarding remain compact and accessible", () => {
  assert.match(css, /data-testid="coach-primary-objective"/);
  assert.match(css, /max-height:318px!important/);
  assert.match(css, /data-testid="coach-onboarding-state"/);
  assert.match(css, /min-height:48px!important/);
  assert.match(activationCss, /@media\(max-width:700px\)/);
  assert.match(activationCss, /min-height:48px/);
});

test("reduced motion remains a global visual-system requirement", () => {
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
