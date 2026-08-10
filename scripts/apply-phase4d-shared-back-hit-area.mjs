import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
let source = readFileSync(appPath, 'utf8');

const classMarker = 'className="shared-dashboard-back-action"';
if (source.includes(classMarker)) {
  console.log('Phase 4D shared dashboard back hit-area already applied.');
  process.exit(0);
}

const contentMarker = '<span aria-hidden="true">←</span>{label}';
const markerIndex = source.indexOf(contentMarker);
if (markerIndex < 0 || source.indexOf(contentMarker, markerIndex + contentMarker.length) >= 0) {
  throw new Error('Phase 4D expected exactly one shared dashboard back-control template marker.');
}

const buttonStart = source.lastIndexOf('<button', markerIndex);
if (buttonStart < 0 || markerIndex - buttonStart > 2200) {
  throw new Error('Phase 4D could not safely resolve the shared dashboard back-control button.');
}

const buttonEnd = source.indexOf('</button>', markerIndex);
if (buttonEnd < 0) {
  throw new Error('Phase 4D could not resolve the end of the shared dashboard back-control button.');
}

let buttonSource = source.slice(buttonStart, buttonEnd + '</button>'.length);
const paddingMarker = 'padding:"9px 14px"';
if (!buttonSource.includes(paddingMarker) || buttonSource.indexOf(paddingMarker) !== buttonSource.lastIndexOf(paddingMarker)) {
  throw new Error('Phase 4D expected one 9px/14px padding contract inside the shared back-control template.');
}

buttonSource = buttonSource.replace('<button', '<button className="shared-dashboard-back-action"');
buttonSource = buttonSource.replace(
  paddingMarker,
  'minHeight:44,padding:"9px 14px",touchAction:"manipulation"',
);

source = source.slice(0, buttonStart) + buttonSource + source.slice(buttonEnd + '</button>'.length);
writeFileSync(appPath, source);
console.log('Applied Phase 4D shared dashboard back hit-area correction.');
