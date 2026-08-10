import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
let source = readFileSync(appPath, 'utf8');

const componentSignature = 'function DashboardReturnButton({onClick,label="Dashboard"}){';
const classMarker = 'className="shotlab-dashboard-return-button"';
const styleImport = 'import "./styles/Phase4dReturnNavigation.css";';

const componentStart = source.indexOf(componentSignature);
if (componentStart < 0) {
  throw new Error('Phase 4D could not find the shared DashboardReturnButton component.');
}

const componentEnd = source.indexOf('\n}\n\n', componentStart);
if (componentEnd < 0) {
  throw new Error('Phase 4D could not resolve the DashboardReturnButton component boundary.');
}

let component = source.slice(componentStart, componentEnd + 3);

if (!component.includes(classMarker)) {
  const buttonAnchor = 'return <button\n    type="button"';
  if (!component.includes(buttonAnchor)) {
    throw new Error('Phase 4D expected the shared DashboardReturnButton opening template.');
  }
  component = component.replace(
    buttonAnchor,
    'return <button\n    className="shotlab-dashboard-return-button"\n    type="button"',
  );
  source = `${source.slice(0, componentStart)}${component}${source.slice(componentEnd + 3)}`;
}

if (!source.includes(styleImport)) {
  const importAnchor = 'import "./styles/CoachInteractiveDashboard.css";';
  if (!source.includes(importAnchor)) {
    throw new Error('Phase 4D expected the CoachInteractiveDashboard stylesheet import anchor.');
  }
  source = source.replace(importAnchor, `${importAnchor}\n${styleImport}`);
}

writeFileSync(appPath, source);
console.log('Applied Phase 4D shared return-navigation hit-area correction.');
