import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const semanticSource = read("src/theme/semanticColors.js");
const tokenSource = read("src/theme/appTokens.js");
const themeSource = read("src/theme/buildThemeTokens.js");
const appSource = read("src/App.jsx");
const statusSource = read("src/components/SemanticStatus.jsx");
const statusCss = read("src/components/SemanticStatus.module.css");
const mobileCss = read("src/components/MobileNavigation.module.css");

const semanticHexes = [...semanticSource.matchAll(/(?:SUCCESS|INFO|WARNING|DANGER|NEUTRAL):\s*"(#[0-9A-F]{6})"/g)].map((match) => match[1]);

test("semantic colors are explicit, fixed, and mutually distinct", () => {
  assert.equal(semanticHexes.length, 5);
  assert.equal(new Set(semanticHexes).size, 5);
  assert.match(semanticSource, /SUCCESS: "#4ADE80"/);
  assert.match(semanticSource, /INFO: "#38BDF8"/);
  assert.match(semanticSource, /WARNING: "#F59E0B"/);
  assert.match(semanticSource, /DANGER: "#F87171"/);
  assert.match(semanticSource, /NEUTRAL: "#94A3B8"/);
});

test("app and runtime theme tokens expose semantic roles independently from team branding", () => {
  assert.match(tokenSource, /\.\.\.SEMANTIC_COLORS/);
  for (const role of ["success", "info", "warning", "danger", "neutral"]) {
    assert.match(themeSource, new RegExp(`--semantic-${role}`));
  }
  assert.match(themeSource, /Team colors control identity and primary actions only/);
});

test("legacy aliases no longer collapse warning and information into team colors", () => {
  assert.doesNotMatch(appSource, /const ORANGE = TOKENS\.PRIMARY/);
  assert.doesNotMatch(appSource, /const CYAN = TOKENS\.SECONDARY/);
  assert.match(appSource, /const ORANGE = WARNING/);
  assert.match(appSource, /const CYAN = INFO/);
  assert.match(appSource, /const SUCCESS = TOKENS\.SUCCESS/);
  assert.match(appSource, /const DANGER = TOKENS\.DANGER/);
});

test("page identity and semantic status colors use separate roles", () => {
  assert.match(appSource, /events:\{accent:"var\(--semantic-info\)"/);
  assert.match(appSource, /sc:\{accent:"var\(--semantic-neutral\)"/);
  assert.match(appSource, /players:\{accent:"var\(--team-brand-secondary/);
  assert.doesNotMatch(appSource, /eventsDatePill[^\n]+#FFC400/);
  assert.match(appSource, /eventsDatePill[^\n]+var\(--semantic-info-surface\)/);
});

test("team branding cannot repaint semantic badges", () => {
  assert.match(appSource, /\.team-brand \.chip:not\(\[data-tone\]\)/);
  assert.match(appSource, /\.team-brand \[class\*="badge"\]:not\(\[data-tone\]\)/);
  assert.doesNotMatch(appSource, /\.team-brand \.chip,\.team-brand \.badge,\[class\*="chip"\],\[class\*="badge"\]/);
  assert.match(statusSource, /data-tone=\{safeTone\}/);
  assert.match(statusCss, /data-tone="success"/);
  assert.match(statusCss, /data-tone="warning"/);
  assert.match(statusCss, /data-tone="danger"/);
});

test("high-signal feedback uses semantic roles", () => {
  assert.match(appSource, /tone:"danger"/);
  assert.match(appSource, /tone:"success"/);
  assert.match(appSource, /tone:"warning"/);
  assert.match(appSource, /<SemanticStatus tone=\{p\.statusMeta\.tone\}/);
  assert.match(appSource, /const resultColor=isPending\?WARNING:won\?SUCCESS:tied\?INFO:DANGER/);
  assert.match(appSource, /const pcol=pct>=80\?SUCCESS:pct>=50\?WARNING:DANGER/);
  assert.match(appSource, /const c=pct>=90\?SUCCESS:pct>=75\?SUCCESS:pct>=50\?WARNING:DANGER/);
});

test("navigation attention indicators use warning rather than brand accent", () => {
  const notificationRule = mobileCss.slice(mobileCss.indexOf(".notificationDot"), mobileCss.indexOf(".overlay"));
  assert.match(notificationRule, /--semantic-warning/);
  assert.doesNotMatch(notificationRule, /background: var\(--accent/);
});
