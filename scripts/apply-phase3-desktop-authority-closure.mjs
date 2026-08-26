import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE_SHA = 'fb4f254c53ecb1d9f11e430307ff4eb7d4e0f122';
const hierarchyPath = 'src/styles/MissionControlHierarchy2026.css';
const legacyV2Path = 'src/components/CoachMissionControlV2.css';
const titlePath = 'src/components/CoachMissionControlTitleStage.css';

const readFrozenBase = (path) => execFileSync(
  'git',
  ['show', `${BASE_SHA}:${path}`],
  { encoding: 'utf8' },
);

// Restore the late support hierarchy and desktop/base V2 foundation first.
// Phase 3 should not add a parallel cascade authority.
fs.writeFileSync(hierarchyPath, readFrozenBase(hierarchyPath));
fs.writeFileSync(legacyV2Path, readFrozenBase(legacyV2Path));

let v2 = fs.readFileSync(legacyV2Path, 'utf8');

// Desktop Coach Home lives on the light editorial canvas. Reuse the existing
// desktop/base control rule rather than adding a duplicate late override.
const darkControls = ".mcTeamSelect,.mcBell{height:45px;border:1px solid var(--mc-line);border-radius:13px;background:rgba(6,10,12,.82);color:#eef2f4;cursor:pointer}";
const lightControls = ".mcTeamSelect,.mcBell{height:45px;border:1px solid var(--mc-line);border-radius:13px;background:#fff;color:#111a21;cursor:pointer}";
if (!v2.includes(darkControls)) throw new Error('Frozen Coach desktop control authority changed');
v2 = v2.replace(darkControls, lightControls);

// One inherited color on the existing hero-content owner fixes the desktop
// program identity and headline. The eyebrow and supporting copy already own
// their explicit accent/muted colors. Mobile title-stage rules remain untouched.
const heroContent = ".mcHeroContent{position:relative;z-index:4;width:55%;padding:34px 32px 30px}";
const heroContentWithColor = ".mcHeroContent{position:relative;z-index:4;width:55%;padding:34px 32px 30px;color:#f4f7f8}";
if (!v2.includes(heroContent)) throw new Error('Frozen Coach hero-content authority changed');
v2 = v2.replace(heroContent, heroContentWithColor);

fs.writeFileSync(legacyV2Path, v2.endsWith('\n') ? v2 : `${v2}\n`);

// The canonical title stage remains the mobile identity/title authority and
// must never need specificity escalation to coexist with this desktop base.
const title = fs.readFileSync(titlePath, 'utf8');
if (/!important|html\s+body\s+#root/.test(title)) {
  throw new Error('Canonical Coach title authority must not escalate specificity');
}

console.log('Phase 3 Coach Home reduced to existing source-owned desktop/base declarations.');
