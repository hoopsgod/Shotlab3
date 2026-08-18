import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
let source = readFileSync(appPath, 'utf8');
const migrations = [
  ['title="Drills Dashboard"', 'title="Drills"'],
  ['title="Strength & Conditioning Dashboard"', 'title="S&C"'],
  ['title="Activity Dashboard"', 'title="Activity"'],
  ['title="Leaderboards Dashboard"', 'title="Leaderboards"'],
];

for (const [legacyTitle, finalTitle] of migrations) {
  if (source.includes(legacyTitle)) source = source.replace(legacyTitle, finalTitle);
  if (!source.includes(finalTitle)) throw new Error(`Missing source-owned Coach title: ${finalTitle}`);
}

writeFileSync(appPath, source);
console.log('Moved compact Coach secondary titles into source ownership.');
