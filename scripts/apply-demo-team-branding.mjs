import { readFileSync, writeFileSync } from 'node:fs';

const demoDataPath = 'src/lib/demoData.js';
let source = readFileSync(demoDataPath, 'utf8');

const marker = 'logoUrl: "/branding/titans-exact-logo.png.PNG"';
if (source.includes(marker)) {
  console.log('Demo Titans branding and crest already seeded.');
  process.exit(0);
}

const anchor = `    name: "Demo Titans",\n    ownerCoachId: coachEmail || null,`;
const replacement = `    name: "Demo Titans",\n    branding: {\n      teamName: "Demo Titans",\n      logoUrl: "/branding/titans-exact-logo.png.PNG",\n      logoMarkUrl: "/branding/titans-exact-logo.png.PNG",\n    },\n    ownerCoachId: coachEmail || null,`;
const firstIndex = source.indexOf(anchor);
if (firstIndex < 0 || source.indexOf(anchor, firstIndex + anchor.length) >= 0) {
  throw new Error('Expected exactly one default Demo Titans team anchor in src/lib/demoData.js.');
}

source = source.replace(anchor, replacement);
writeFileSync(demoDataPath, source);
console.log('Seeded Demo Titans team name and exact Titans crest for Coach and Player demos.');
