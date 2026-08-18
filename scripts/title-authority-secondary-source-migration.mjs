import { readFileSync, writeFileSync } from 'node:fs';

const replaceOrVerify = (source, from, to, label) => {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one source anchor, found ${count}`);
  return source.replace(from, to);
};

// Move compact Coach route labels into committed source so the build never rewrites page-purpose copy.
const appPath = 'src/App.jsx';
let app = readFileSync(appPath, 'utf8');
for (const [legacyTitle, finalTitle] of [
  ['title="Drills Dashboard"', 'title="Drills"'],
  ['title="Strength & Conditioning Dashboard"', 'title="S&C"'],
  ['title="Activity Dashboard"', 'title="Activity"'],
  ['title="Leaderboards Dashboard"', 'title="Leaderboards"'],
]) {
  if (app.includes(legacyTitle)) app = app.replace(legacyTitle, finalTitle);
  if (!app.includes(finalTitle)) throw new Error(`Missing source-owned Coach title: ${finalTitle}`);
}
writeFileSync(appPath, app);

// Move Player Events / S&C page identity into the same production title primitive.
const commitmentPath = 'src/components/PlayerCommitmentCenter.jsx';
let commitment = readFileSync(commitmentPath, 'utf8');
commitment = replaceOrVerify(
  commitment,
  'import styles from "./PlayerCommitmentCenter.module.css";\n',
  'import styles from "./PlayerCommitmentCenter.module.css";\nimport TeamIdentityTitleStage from "./TeamIdentityTitleStage.jsx";\n',
  'Player commitment title primitive import',
);
const legacyHeader = `      <header className={styles.routeHeader} data-testid={\`player-commitment-route-header-\${mode}\`}>\n        <div className={styles.routeEyebrow}>{model?.eyebrow || (isStrength ? "Physical development" : "Team commitments")}</div>\n        <div className={styles.routeTitleRow}>\n          <h1>{model?.title || (isStrength ? "Strength & Conditioning" : "Events & Attendance")}</h1>\n          <span>{routeStatus}</span>\n        </div>\n        <p>{routeSubtitle}</p>\n      </header>`;
const sharedHeader = `      <TeamIdentityTitleStage\n        variant="standard"\n        surface="light"\n        role={model?.eyebrow || (isStrength ? "Physical Development" : "Team Commitments")}\n        title={model?.title || (isStrength ? "Strength & Conditioning" : "Events & Attendance")}\n        summary={routeSubtitle}\n        status={routeStatus}\n        testId={\`player-commitment-route-header-\${mode}\`}\n        dataLayoutRole="editorial-header"\n        dataVisualRole="player-team-workspace-title"\n        dataPageKind={mode}\n        dataMobileStage="team-identity"\n        ariaLabel={\`${isStrength ? "Strength and Conditioning" : "Events and Attendance"} team identity and page title\`}\n      />`;
commitment = replaceOrVerify(commitment, legacyHeader, sharedHeader, 'Player commitment shared title stage');
if (/className=\{styles\.routeHeader\}/.test(commitment)) throw new Error('Legacy Player commitment route header still exists.');
writeFileSync(commitmentPath, commitment);

// Delete the now-unused parallel title CSS; the shared primitive owns title geometry.
const commitmentCssPath = 'src/components/PlayerCommitmentCenter.module.css';
let commitmentCss = readFileSync(commitmentCssPath, 'utf8');
commitmentCss = commitmentCss.replace(/\.routeHeader \{[\s\S]*?\.routeHeader > p \{[\s\S]*?\}\n\n/, '');
commitmentCss = commitmentCss.replace(/\n  \.routeTitleRow \{[\s\S]*?\n  \.routeTitleRow > span \{[\s\S]*?\n  \}\n(?=\n  \.hero)/, '\n');
commitmentCss = commitmentCss.replace(/\n  \.routeTitleRow \{[\s\S]*?\n  \.routeTitleRow > span \{[\s\S]*?\n  \}\n(?=\n  \.heroBody)/, '\n');
for (const obsolete of ['.routeHeader {', '.routeEyebrow {', '.routeTitleRow {', '.routeHeader > p {']) {
  if (commitmentCss.includes(obsolete)) throw new Error(`Obsolete Player commitment title CSS remains: ${obsolete}`);
}
writeFileSync(commitmentCssPath, commitmentCss);

console.log('Moved Coach labels and Player commitment title composition into committed source ownership.');
