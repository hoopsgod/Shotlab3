import { readFileSync, writeFileSync } from 'node:fs';

const demoDataPath = 'src/lib/demoData.js';
let source = readFileSync(demoDataPath, 'utf8');

const exactLogo = '/branding/titans-exact-logo.png.PNG';
const finalMarker = 'const DEMO_TEAM_BRANDING = Object.freeze({';

if (source.includes(finalMarker)) {
  console.log('Demo Titans branding normalization already applied.');
  process.exit(0);
}

const constantsAnchor = 'const DEMO_TEAM_ID = "team-demo-titans";\nconst DEMO_TIMESTAMP = Date.parse("2026-03-20T12:00:00.000Z");';
const constantsReplacement = `const DEMO_TEAM_ID = "team-demo-titans";\nconst DEMO_TIMESTAMP = Date.parse("2026-03-20T12:00:00.000Z");\nconst DEMO_TEAM_BRANDING = Object.freeze({\n  teamName: "Demo Titans",\n  logoUrl: "${exactLogo}",\n  logoMarkUrl: "${exactLogo}",\n});`;
if (!source.includes(constantsAnchor)) {
  throw new Error('Could not locate Demo Titans constants anchor in src/lib/demoData.js.');
}
source = source.replace(constantsAnchor, constantsReplacement);

const functionStart = source.indexOf('function buildDemoTeam(teamId, coachEmail, team) {');
const functionEnd = source.indexOf('\n}\n\nexport function buildDemoDataBundle', functionStart);
if (functionStart < 0 || functionEnd < 0) {
  throw new Error('Could not locate buildDemoTeam in src/lib/demoData.js.');
}
const legacyFunction = source.slice(functionStart, functionEnd + 2);
const finalFunction = `function buildDemoTeam(teamId, coachEmail, team) {\n  if (team) {\n    const existing = clone(team);\n    const currentName = String(existing?.name || "").trim();\n    const currentBrandingName = String(existing?.branding?.teamName || "").trim();\n    const genericName = !currentName || /^(demo team|shotlab team)$/i.test(currentName);\n    const genericBranding = !currentBrandingName || /^(demo team|shotlab team)$/i.test(currentBrandingName);\n    const shouldSeedDemoIdentity = genericName && genericBranding;\n    return {\n      ...existing,\n      id: teamId || existing.id,\n      ...(shouldSeedDemoIdentity ? {\n        name: "Demo Titans",\n        branding: {\n          ...(existing.branding || {}),\n          ...DEMO_TEAM_BRANDING,\n          logoUrl: existing?.branding?.logoUrl || DEMO_TEAM_BRANDING.logoUrl,\n          logoMarkUrl: existing?.branding?.logoMarkUrl || existing?.branding?.logoUrl || DEMO_TEAM_BRANDING.logoMarkUrl,\n        },\n      } : {}),\n      ownerCoachId: coachEmail || existing.ownerCoachId || existing.coachEmail || null,\n      updatedAt: Date.now(),\n    };\n  }\n\n  return {\n    id: teamId || DEMO_TEAM_ID,\n    name: "Demo Titans",\n    branding: { ...DEMO_TEAM_BRANDING },\n    ownerCoachId: coachEmail || null,\n    createdAt: DEMO_TIMESTAMP,\n    joinCode: "DEMO26",\n    updatedAt: Date.now(),\n  };\n}`;
if (!/name:\s*"Demo Titans"/.test(legacyFunction)) {
  throw new Error('buildDemoTeam no longer matches the expected Demo Titans source shape.');
}
source = source.slice(0, functionStart) + finalFunction + source.slice(functionEnd + 2);

writeFileSync(demoDataPath, source);
console.log('Normalized generic Demo Team identity to Demo Titans with the exact crest while preserving explicit demo customizations.');
