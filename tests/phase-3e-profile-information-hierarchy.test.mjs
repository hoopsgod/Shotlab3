import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const profile = readFileSync('src/components/PlayerCareerHistory.jsx', 'utf8');
const css = readFileSync('src/components/PlayerCareerHistory.module.css', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');

test('Phase 3E gives Player Profile one compact career identity instead of repeating athlete identity', () => {
  assert.match(profile, /const isPlayerView = viewerRole === "player"/);
  assert.match(profile, /Career snapshot/);
  assert.match(profile, /Progress that stays with you\./);
  assert.match(profile, /isPlayerView \? \([\s\S]*?playerSnapshotCopy[\s\S]*?\) : \([\s\S]*?identityMark/s);
  assert.match(css, /\.shell\[data-viewer-role="player"\]\{padding:0;border:0;border-radius:0;background:transparent;box-shadow:none\}/);
});

test('Player career summary removes the duplicate career-makes tile and preserves supporting metrics', () => {
  assert.match(profile, /const visibleMetrics = isPlayerView \? metrics\.slice\(1\) : metrics/);
  assert.match(profile, /At-home makes/);
  assert.match(profile, /Program entries/);
  assert.match(profile, /Team participation/);
  assert.match(css, /\.ledgerPlayer\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});

test('Player milestone becomes a restrained light surface rather than a second page-level dark block', () => {
  assert.match(profile, /styles\.milestoneCardPlayer/);
  assert.match(css, /\.milestoneCardPlayer\{[\s\S]*?background:color-mix\(in srgb,var\(--accent,#8ea900\) 6%,#faf9f5\);[\s\S]*?color:#1b211d;[\s\S]*?box-shadow:0 10px 28px/s);
  assert.match(css, /\.milestoneCardPlayer \.milestoneTrack\{background:#e2e5dc\}/);
});

test('Secondary career records and season archive move behind a native Player disclosure', () => {
  assert.match(profile, /<details className=\{styles\.careerDisclosure\} data-testid="player-career-detail-disclosure">/);
  assert.match(profile, /Records & season archive/);
  assert.match(profile, /\{recordsSection\}\{seasonSection\}/);
  assert.match(css, /\.careerDisclosureSummary::after\{content:"View"/);
  assert.match(css, /\.careerDisclosure\[open\] \.careerDisclosureSummary::after\{content:"Hide"\}/);
  assert.match(css, /\.careerDisclosureSummary:focus-visible\{/);
});

test('Coach athlete history remains expanded and retains the existing athlete identity treatment', () => {
  assert.match(profile, /<div className=\{styles\.identityMark\} aria-hidden="true">\{initials\(identity\)\}<\/div>/);
  assert.match(profile, /<div className=\{styles\.eyebrow\}>Coach athlete view<\/div>/);
  assert.match(profile, /\) : \(\s*<>\{recordsSection\}\{seasonSection\}<\/\>\s*\)\}/s);
});

test('App Store presentation workflow includes the Phase 3E contract and evidence package', () => {
  assert.match(workflow, /tests\/phase-3e-profile-information-hierarchy\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3e-profile-hierarchy-evidence/);
});
