import { readFileSync } from 'node:fs';

const demoDataPath = 'src/lib/demoData.js';
const source = readFileSync(demoDataPath, 'utf8');

const requiredContracts = [
  ['Demo Titans team name', /teamName:\s*"Demo Titans"/],
  ['exact Titans logo URL', /logoUrl:\s*"\/branding\/titans-exact-logo\.png\.PNG"/],
  ['Titans mark URL', /logoMarkUrl:\s*"\/branding\/titans-default-mark\.svg"/],
  ['source-owned demo branding constant', /const DEMO_TEAM_BRANDING = Object\.freeze\(\{/],
  ['source-owned team field', /teamName:\s*DEMO_TEAM_BRANDING\.teamName/],
  ['source-owned logo field', /logoUrl:\s*DEMO_TEAM_BRANDING\.logoUrl/],
  ['source-owned logo mark field', /logoMarkUrl:\s*DEMO_TEAM_BRANDING\.logoMarkUrl/],
];

for (const [label, pattern] of requiredContracts) {
  if (!pattern.test(source)) throw new Error(`Demo Titans ${label} is not source-owned in ${demoDataPath}.`);
}

console.log('Verified source-owned Demo Titans teamName, logoUrl and logoMarkUrl; no build-time identity mutation performed.');
