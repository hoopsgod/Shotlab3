import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

const secondaryJsx = read("../src/components/SecondaryPageSystem.jsx");
const secondaryCss = read("../src/components/SecondaryPageSystem.css");
const primitives = read("../src/components/CoachDashboardPrimitives.jsx");
const coachSecondary = read("../src/components/CoachInteractiveDashboards.jsx");
const playerDaily = read("../src/components/PlayerDailyCommandCenter.jsx");
const visualHierarchy = read("../src/components/VisualHierarchy.jsx");
const surfaceCss = read("../src/styles/Phase3SurfaceContracts.css");
const expertCss = read("../src/styles/ExpertVisualPolish.css");
const v5CoachIntegrityCss = read("../public/shotlab-v5-coach-integrity.css");
const parityCss = read("../public/shotlab-v8-demo-parity.css");
const sessionIntegrityCss = read("../public/shotlab-v15-session-integrity.css");
const phase2CriticalCss = read("../public/shotlab-phase2-critical.css");
const secondaryCohesionCss = read("../public/shotlab-phase3-secondary-cohesion.css");
const teamStoreImmersiveCss = read("../public/shotlab-phase3i-team-store-immersive.css");
const strengthHierarchyCss = read("../public/shotlab-phase3k-coach-strength-hierarchy.css");
const finalClosureCss = read("../public/shotlab-phase3v-final-closure.css");
const accountTouchEnhancer = read("../scripts/apply-phase4e10-player-profile-account-touch-safety.mjs");
const industrial = read("../src/lib/industrialDesignFoundation.js");
const visualReboot = read("../src/lib/visualSystemReboot.js");
const main = read("../src/main.jsx");

const rgb = (hex) => {
  const normalized = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255);
};

const luminance = (hex) => rgb(hex)
  .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);

const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

test("secondary page materials are explicit instead of inferred from names", () => {
  assert.match(secondaryJsx, /data-visual-role="secondary-page"[^>]*data-surface="light"|data-surface="light"[^>]*data-visual-role="secondary-page"/);
  assert.match(secondaryJsx, /data-visual-role="page-intro"/);
  assert.match(secondaryJsx, /data-surface="dark" data-visual-role="primary-decision"/);
  assert.match(secondaryJsx, /data-surface="light" data-visual-role="supporting-evidence"/);
});

test("shared dashboard primitives publish material-aware semantic roles", () => {
  for (const role of ["command-bar", "metric-strip", "filter-rail", "insight-grid", "insight-card", "insight-actions", "dashboard-section", "progress-block", "progress-meta", "progress-track", "detail-drawer"]) {
    assert.match(primitives, new RegExp(`data-visual-role="${role}"`));
  }
  assert.match(primitives, /surface = "dark"/);
  assert.match(primitives, /data-surface="dark" data-visual-role="command-bar"/);
  assert.match(primitives, /data-surface="dark" data-visual-role="detail-drawer"/);
  assert.match(primitives, /data-action-role=\{action\.danger \? "destructive" : index === 0 \? "primary" : "secondary"\}/);
  assert.match(primitives, /data-action-role="tertiary"/);
});

test("secondary Coach dashboards opt context-dependent dark primitives into the light editorial material", () => {
  assert.match(coachSecondary, /<InteractiveMetricStrip surface="light"/);
  assert.match(coachSecondary, /<DashboardFilterRail surface="light"/);
  assert.match(coachSecondary, /<DashboardInsightCard surface="light"/);
});

test("Player Home and disclosure support copy publish stable semantic roles", () => {
  for (const role of ["next-actions-heading", "next-actions-eyebrow", "next-actions-title", "next-actions-meta"]) {
    assert.match(playerDaily, new RegExp(`data-visual-role="${role}"`));
  }
  for (const role of ["progressive-disclosure", "disclosure-summary", "disclosure-title", "disclosure-meta", "disclosure-chevron", "disclosure-body"]) {
    assert.match(visualHierarchy, new RegExp(`data-visual-role="${role}"`));
  }
});

test("active consolidated visual authorities contain no substring-selector material heuristics", () => {
  for (const authority of [secondaryCss, surfaceCss, expertCss, v5CoachIntegrityCss, parityCss, sessionIntegrityCss, phase2CriticalCss, secondaryCohesionCss, teamStoreImmersiveCss, strengthHierarchyCss, finalClosureCss, industrial, visualReboot]) {
    assert.doesNotMatch(authority, /\[class\s*\*=/i);
    assert.doesNotMatch(authority, /\[data-testid\s*\*=/i);
  }
  assert.doesNotMatch(v5CoachIntegrityCss, /\.secondaryPage(?:Decision|Evidence|Toolbar)/);
  assert.doesNotMatch(visualReboot, /\.secondaryPageShell|\.secondaryPageDecision|EmptyState|emptyState/);
  assert.match(secondaryCss, /\[data-visual-role="metric-strip"\]/);
  assert.match(secondaryCss, /\[data-visual-role="filter-rail"\]/);
  assert.match(secondaryCss, /\[data-visual-role="insight-actions"\]/);
  assert.match(sessionIntegrityCss, /\[data-visual-role="insight-card"\]\[data-surface="dark"\]/);
  assert.match(phase2CriticalCss, /\[data-testid="mobile-navigation-sheet"\]\s+p/);
  assert.match(secondaryCohesionCss, /\[data-identity-role="tagline"\]/);
  assert.match(secondaryCohesionCss, /\[data-visual-role="career-record"\]/);
  assert.match(secondaryCohesionCss, /\[data-copy-tone="muted"\]/);
  assert.match(strengthHierarchyCss, /\[data-premium-metric-label\]/);
  assert.match(strengthHierarchyCss, /\[data-premium-metric-value\]/);
  assert.match(finalClosureCss, /\[data-visual-role="next-actions-title"\]/);
  assert.match(finalClosureCss, /\[data-visual-role="disclosure-title"\]/);
  assert.match(industrial, /\[data-surface="light"\]/);
});

test("light and dark semantic foreground tokens clear WCAG normal-text contrast", () => {
  const lightCanvas = "#f5f5f2";
  const darkCanvas = "#171b18";
  for (const foreground of ["#171a18", "#3f4842", "#68706a", "#465717"]) {
    assert.ok(contrast(foreground, lightCanvas) >= 4.5, `${foreground} must remain readable on the light canvas`);
  }
  for (const foreground of ["#f5f7f4", "#d7ddd8", "#aeb7b0"]) {
    assert.ok(contrast(foreground, darkCanvas) >= 4.5, `${foreground} must remain readable on the dark decision surface`);
  }
});

test("semantic foreground authority protects known contrast regressions through nearest-surface variables", () => {
  assert.match(surfaceCss, /\[data-surface="light"\][\s\S]*--surface-title:\s*var\(--sl-surface-light-title\)/);
  assert.match(surfaceCss, /\[data-surface="dark"\][\s\S]*--surface-title:\s*var\(--sl-surface-dark-title\)/);
  assert.match(surfaceCss, /\[data-surface\]\s+:is\(h1, h2, h3, h4\)[\s\S]*color:\s*var\(--surface-title\)/);
  assert.match(surfaceCss, /\[data-surface\]\s+p\s*\{[\s\S]*color:\s*var\(--surface-body\)/);
  assert.match(surfaceCss, /\[data-surface\]\s+:is\(small, \[data-copy-tone="muted"\]\)[\s\S]*color:\s*var\(--surface-muted\)/);
  assert.match(surfaceCss, /\[data-surface\]\s+\[data-visual-role="progress-meta"\][\s\S]*color:\s*var\(--surface-muted\)/);
  assert.match(surfaceCss, /\[data-surface\]\s+:is\(input, select, textarea\)[\s\S]*color:\s*var\(--surface-title\)/);
  assert.match(surfaceCss, /-webkit-text-fill-color:\s*currentColor/);
  assert.doesNotMatch(expertCss, /\[data-testid\s*\*=\s*"(?:insight|decision)/i);
});

test("team branding stays decorative when light-surface controls require a stable foreground", () => {
  assert.match(surfaceCss, /--sl-accent-foreground-light:\s*#465717/);
  assert.match(surfaceCss, /button\[data-player-profile-privacy-toggle\][\s\S]*color:\s*var\(--sl-accent-foreground-light\)/);
  assert.match(surfaceCss, /a\[data-player-profile-legal-link\][\s\S]*color:\s*var\(--sl-accent-foreground-light\)/);
  assert.match(accountTouchEnhancer, /const privacyAccentBefore = 'color:u\.hideFromLeaderboards\?MUTED:VOLT'/);
  assert.match(accountTouchEnhancer, /const privacyAccentAfter = 'color:u\.hideFromLeaderboards\?MUTED:"#465717"'/);
  assert.match(accountTouchEnhancer, /app = app\.replace\(privacyAccentBefore, privacyAccentAfter\)/);
  assert.match(accountTouchEnhancer, /const legalBefore = '<a[^\n]+color:compact\?VOLT:MUTED/);
  assert.match(accountTouchEnhancer, /const legalAfter = '<a[^\n]+color:compact\?"#465717":MUTED/);
});

test("Player Rankings removes the repeated embedded hub introduction but keeps live status", () => {
  assert.match(surfaceCss, /data-workspace-tab="leaderboards"[\s\S]*premium-leaderboards-hub[\s\S]*:not\(\[data-testid="leaderboard-status-line"\]\)[\s\S]*display:\s*none/);
  assert.match(surfaceCss, /leaderboard-status-line[\s\S]*margin-top:\s*0/);
});

test("Team Store mobile portal owns the viewport and light empty-state foregrounds", () => {
  assert.match(teamStoreImmersiveCss, /html\.team-store-portal-open body > #root[\s\S]*display:\s*none\s*!important/);
  assert.match(teamStoreImmersiveCss, /\[data-testid="mobile-navigation-dock"\][\s\S]*display:\s*none\s*!important/);
  assert.match(teamStoreImmersiveCss, /\.ts-empty-state p[\s\S]*color:\s*#5f6861\s*!important/);
  assert.match(teamStoreImmersiveCss, /\.ts-empty-state \.ts-button-secondary[\s\S]*color:\s*#273129\s*!important/);
});

test("Phase 3 mobile contract protects 390px geometry, touch targets and iPhone safe areas", () => {
  assert.match(surfaceCss, /--sl-phase3-touch-target:\s*44px/);
  assert.match(surfaceCss, /padding-bottom:\s*calc\(96px \+ env\(safe-area-inset-bottom,\s*0px\)\)/);
  assert.match(surfaceCss, /@media \(max-width:\s*430px\)/);
  assert.match(surfaceCss, /safe-area-inset-left/);
  assert.match(surfaceCss, /safe-area-inset-right/);
  assert.match(secondaryCss, /@media \(max-width:\s*390px\)/);
  assert.match(surfaceCss, /overflow-wrap:\s*anywhere/);
});

test("surface contract is role-neutral for Coach, Player, demo and registered sessions", () => {
  assert.doesNotMatch(surfaceCss, /\.shotlab-demo|\[data-demo/i);
  assert.doesNotMatch(surfaceCss, /\.coach[A-Z_-]|\.player[A-Z_-]/);
  assert.match(surfaceCss, /\[data-visual-role="secondary-page"\]/);
  assert.doesNotMatch(parityCss, /\.shotlab-demo/);
  assert.doesNotMatch(parityCss, /demoCard|demoPanel|demoBanner|demoNotice|demoBadge/);
});

test("semantic surface contract loads after the previous cascade lock", () => {
  const cascadeLock = main.indexOf("MissionControlCascadeLock2026.css");
  const phase3 = main.indexOf("Phase3SurfaceContracts.css");
  assert.ok(cascadeLock >= 0, "existing cascade lock import must remain present");
  assert.ok(phase3 > cascadeLock, "Phase 3 semantic contract must load after the previous visual authority");
});
