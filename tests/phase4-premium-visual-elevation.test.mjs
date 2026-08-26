import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assertDeclaration, declaration, mediaBlock, ruleBlock } from './helpers/css-contract.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Phase 4 composes the first view as one branded program-intelligence surface', async () => {
  const source = await read('src/components/CoachCommandCenter.jsx');

  assert.match(source, /data-visual-system="phase-4-premium"/);
  assert.match(source, /data-layout-role="program-intelligence">\{pulsePanel\}\{attentionPanel\}/);
  assert.ok(source.indexOf('{pulsePanel}{attentionPanel}') < source.indexOf('{sessionPanel}{livePanel}'));
  assert.match(source, /data-pulse-state=\{state\}/);
  assert.match(source, /role="progressbar"/);
  assert.match(source, /aria-valuemin=\{0\}/);
  assert.match(source, /aria-valuemax=\{100\}/);
  assert.match(source, /No weekly goal data/);
  assert.match(source, /data-attention-priority=\{priority \+ 1\}/);
  assert.match(source, /priority === 0 \? "is-priority"/);
  assert.match(source, /No recent activity/);
  assert.match(source, /No upcoming event/);
});

test('Phase 4 title stage is compact, logo-safe, and motion-safe without specificity patches', async () => {
  const [source, css] = await Promise.all([
    read('src/components/CoachCommandCenter.jsx'),
    read('src/components/CoachMissionControlTitleStage.css'),
  ]);

  assert.match(source, /className="mcCourtLines"/);
  assert.match(source, /className="mcCourtRoute"/);
  assert.doesNotMatch(source, /<defs>|mcTacticalWash/);

  const mobile = mediaBlock(css, '(max-width:700px)');
  const hero = ruleBlock(mobile, '.mcHero[data-team-identity-stage="coach-mission-control"]');
  const identity = ruleBlock(mobile, '.mcHeroIdentity');
  const crest = ruleBlock(mobile, '.mcHeroTeamMark');
  const crestImage = ruleBlock(mobile, '.mcHeroTeamMark img');
  const realityAction = ruleBlock(mobile, '.mcRealityStrip button');
  const primary = ruleBlock(mobile, '.mcPrimary');

  assertDeclaration(hero, 'min-height', '382px');
  assertDeclaration(identity, '--coach-hero-crest', /^clamp\(96px,\s*26vw,\s*108px\)$/);
  for (const property of ['width','height','min-width','min-height','max-width','max-height']) {
    assertDeclaration(crest, property, 'var(--coach-hero-crest)');
  }
  assertDeclaration(crestImage, 'object-fit', 'contain');
  assertDeclaration(crestImage, 'width', '100%');
  assertDeclaration(crestImage, 'height', '100%');
  assertDeclaration(realityAction, 'appearance', 'none');
  assertDeclaration(realityAction, 'background', 'transparent');
  assert.match(declaration(primary, 'background') ?? '', /color-mix/);
  assert.match(declaration(primary, 'border') ?? '', /1px\s+solid/);
  assertDeclaration(primary, 'min-height', '50px');

  const reducedMotion = mediaBlock(css, '(prefers-reduced-motion:reduce)');
  const reducedAction = ruleBlock(reducedMotion, '.mcRealityStrip button');
  assertDeclaration(reducedAction, 'transition', 'none');
  assert.ok(reducedMotion.includes('.mcPrimary'), 'reduced-motion contract must include the primary action');
  assert.doesNotMatch(css, /!important/);
});

test('Phase 4 retires legacy button and Athlete Attention visual authorities', async () => {
  const legacyPaths = [
    'src/styles/MissionControlCascadeLock2026.css',
    'src/styles/MissionControlHierarchy2026.css',
    'src/components/CoachMissionControlShell.css',
    'public/shotlab-v3-foundation.css',
    'public/shotlab-v3-mobile-corrections.css',
    'public/shotlab-v5-coach-integrity.css',
    'public/shotlab-v6-decision-workspaces.css',
    'public/shotlab-v7-page-authority.css',
    'public/shotlab-v9-secondary-polish.css',
    'public/shotlab-phase2-critical.css',
  ];
  const legacyCss = (await Promise.all(legacyPaths.map(read))).join('\n');

  assert.doesNotMatch(legacyCss, /mcAttentionRow/);
  assert.doesNotMatch(legacyCss, /coach-primary-objective[^}]*mcPrimary/);
});

test('Phase 4 supporting intelligence is flat, progressive, and owned by the existing layer', async () => {
  const css = await read('src/components/CoachMissionControlFinal.css');

  assert.match(css, /Phase 4 Coach Home supporting-intelligence authority/);
  assert.match(css, /--mc-light:#f3f1ea/);
  assert.match(css, /\.mcPulseRail/);
  assert.match(css, /repeating-linear-gradient/);
  assert.match(css, /\.mcAttentionRow\.is-priority/);

  const section = ruleBlock(css, '.mcSection');
  const attention = ruleBlock(css, '.mcAttentionRow');
  assertDeclaration(section, 'border-radius', '0');
  assertDeclaration(section, 'box-shadow', 'none');
  const rowHeight = Number.parseFloat(declaration(attention, 'min-height') ?? '0');
  assert.ok(rowHeight >= 72, `attention row must retain deliberate scan/tap geometry; got ${rowHeight}px`);

  const reducedMotion = mediaBlock(css, '(prefers-reduced-motion:reduce)');
  assert.ok(reducedMotion.includes('.mcAttentionRow'), 'supporting intelligence must honor reduced motion');
  assert.doesNotMatch(css, /!important/);
  assert.doesNotMatch(css, /\.mcHeroTeamMark|\.mcRealityStrip|\.mcPrimary|mobile-navigation-dock/);
});
