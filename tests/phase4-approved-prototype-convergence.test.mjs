import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Phase 4 loads the approved prototype convergence authority after the certified mobile system', async () => {
  const [titleStage, convergence] = await Promise.all([
    read('src/components/CoachMissionControlTitleStage.css'),
    read('src/components/CoachApprovedPrototypeConvergence.css'),
  ]);

  assert.match(titleStage, /^@import "\.\/CoachApprovedPrototypeConvergence\.css";/);
  assert.match(convergence, /@media \(min-width:981px\)/);
  assert.match(convergence, /grid-template-columns:184px minmax\(0,1fr\)/);
  assert.match(convergence, /content:"SHOTLAB"/);
  assert.match(convergence, /grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/);
  assert.match(convergence, /\.mcHero\[data-team-identity-stage="coach-mission-control"\][\s\S]*grid-column:1\/10/);
  assert.match(convergence, /\.mcTeamHealth\{[\s\S]*grid-column:10\/-1/);
  assert.match(convergence, /\.mcActivity\{grid-column:1\/6\}/);
  assert.match(convergence, /\.mcAttention\{[\s\S]*grid-column:6\/10/);
  assert.match(convergence, /\.mcNextSession\{[\s\S]*grid-column:10\/-1/);
});

test('approved prototype convergence preserves mobile authority and custom team identity', async () => {
  const convergence = await read('src/components/CoachApprovedPrototypeConvergence.css');

  assert.doesNotMatch(convergence, /max-width:\s*700px/);
  assert.match(convergence, /var\(--team-brand-surface-deep/);
  assert.match(convergence, /\.mcHeader \.mcHeaderTeamMark[\s\S]*display:grid/);
  assert.match(convergence, /\.mcHeroTeamMark[\s\S]*clamp\(128px,12vw,170px\)/);
});
