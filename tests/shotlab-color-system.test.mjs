import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertDeclaration, ruleBlock } from "./helpers/css-contract.mjs";

const css = fs.readFileSync(new URL("../public/shotlab-v3-foundation.css", import.meta.url), "utf8");
const corrections = fs.readFileSync(new URL("../public/shotlab-v3-mobile-corrections.css", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const secondaryCss = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.css", import.meta.url), "utf8");
const titleCss = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.css", import.meta.url), "utf8");
const coach = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const coachTitleCss = fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css", import.meta.url), "utf8");
const coachShellCss = fs.readFileSync(new URL("../src/components/CoachMissionControlShell.css", import.meta.url), "utf8");

const channel = (hex) => {
  const value = Number.parseInt(hex, 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const normalized = hex.replace("#", "");
  const [r, g, b] = [normalized.slice(0, 2), normalized.slice(2, 4), normalized.slice(4, 6)].map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
};

test("V3 palette stays light, restrained, and meets core contrast targets", () => {
  assert.match(css, /--v3-canvas:#f5f5f2/i);
  assert.match(css, /--v3-surface:#ffffff/i);
  assert.match(css, /--v3-ink:#171a18/i);
  assert.match(css, /--v3-muted:#68706a/i);
  assert.match(css, /--v3-accent:#78951f/i);
  assert.ok(contrast("#171a18", "#ffffff") >= 7);
  assert.ok(contrast("#68706a", "#ffffff") >= 4.5);
  assert.ok(contrast("#171a18", "#f5f5f2") >= 7);
  assert.doesNotMatch(css, /hue-rotate|sepia\(1\) saturate\(5\)/i);
});

test("Mission Control uses one dark component-owned program identity hierarchy plus restrained decision typography", () => {
  assert.match(coach, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coach, /CoachMissionControlTitleStage\.css/);
  assert.doesNotMatch(coach, /MOBILE_PRODUCT_RESET_CSS|<style>/);

  const image = ruleBlock(coachTitleCss, '.mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroTeamMark img');
  assert.match(coachTitleCss, /Phase 6E mobile Coach Home composition authority/);
  assert.match(coachTitleCss, /\.mcShellV3\.is-mobile-shell \.mcHero\[data-team-identity-stage="coach-mission-control"\]\{min-height:334px\}/);
  assert.match(coachTitleCss, /\.mcHeroIdentity\{--coach-hero-crest:clamp\(104px,29vw,120px\);gap:12px\}/);
  assert.match(coachTitleCss, /\.mcProgramIdentity\{font:780 11px\/1\.2 -apple-system/);
  assert.match(coachTitleCss, /h1\{max-width:15ch;margin:12px 0 0;font-family:"Barlow Condensed","Arial Narrow","Helvetica Neue",sans-serif;font-size:clamp\(36px,9\.4vw,40px\)/);
  assert.match(coachTitleCss, /\.mcHeroContent>p\{max-width:36ch;margin:7px 0 0;font:520 14px\/1\.42 -apple-system/);
  assert.match(coachTitleCss, /\.mcPrimary\{margin-top:11px\}/);
  assert.match(coachShellCss, /@media\(max-width:700px\)[\s\S]*padding-bottom:calc\(78px \+ env\(safe-area-inset-bottom\)\)!important/);
  assert.doesNotMatch(coachShellCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\]\{min-height:|\.mcProgramIdentity\{|\.mcHeroIdentity\{|\.mcHeroTeamMark\{/);
  assertDeclaration(image, "object-fit", "contain");
  assertDeclaration(image, "width", "100%");
  assertDeclaration(image, "height", "100%");
  assert.match(coachTitleCss, /\.mcHeroContent[\s\S]*width:100%/);
  assert.doesNotMatch(coachTitleCss, /\.mcHeroIdentity::after\s*\{[\s\S]*content:\s*"Mission Control"/);
  assert.doesNotMatch(coachTitleCss, /!important/);
  assert.doesNotMatch(corrections, /\.mcProgramIdentity\b|\.mcHeroIdentity\b|\.mcHeroTeamMark\b/);
  assert.doesNotMatch(corrections, /coach-primary-objective|\.mcHero\s*\{|max-height:\s*310px/);
});

test("secondary coach pages and Team Store share the restrained light-and-dark product language", () => {
  assert.match(secondaryCss, /\.secondaryPageShell[\s\S]*color: var\(--sl-ink/);
  assert.doesNotMatch(secondaryCss, /\.secondaryPageIntro\b/);
  assert.match(titleCss, /\.teamIdentityTitleStage\s*\{[\s\S]*color:\s*#151918/);
  assert.match(titleCss, /\.teamIdentityTitleStage--dark/);
  assert.match(titleCss, /--identity-title:\s*clamp\(42px, 10\.2vw, 44px\)/);
  assert.match(secondaryCss, /\.secondaryPageDecision[\s\S]*linear-gradient\(145deg/);
  assert.match(css, /\.ts-panel[\s\S]*background:var\(--v3-canvas\)/);
  assert.match(css, /\.ts-header h2[\s\S]*font-family:inherit/);
  assert.match(css, /\.ts-field input,[\s\S]*font-size:16px/);
});

test("loading shell, accessibility, and V3 entry points remain intact", () => {
  assert.match(html, /<meta name="theme-color" content="#F5F5F2"/);
  assert.match(html, /name="color-scheme" content="light"/);
  assert.match(html, /href="\/shotlab-v3-foundation\.css"/);
  assert.match(html, /href="\/shotlab-v3-mobile-corrections\.css"/);
  assert.match(html, /id="team-store-root"/);
  assert.match(html, /src="\/src\/main\.jsx"/);
  assert.match(html, /src="\/src\/teamStoreEntry\.jsx"/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
