import { readFileSync, writeFileSync } from "node:fs";

const fail = (message) => { throw new Error(`[phase4a-signature-visual-identity] ${message}`); };
const replaceOne = (source, from, to, label) => {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) fail(`${label}: expected one anchor, found ${count}`);
  return source.replace(from, to);
};

function patchPlayerDaily() {
  const path = "src/components/PlayerDailyCommandCenter.jsx";
  let source = readFileSync(path, "utf8");
  source = replaceOne(
    source,
    'import ShotLabIcon from "./ShotLabIcon";\n',
    'import ShotLabIcon from "./ShotLabIcon";\nimport ShotLabSignatureField from "./ShotLabSignatureField.jsx";\n',
    "PlayerDaily signature import",
  );
  source = replaceOne(
    source,
    '    <section className={styles.root} data-testid="player-daily-command-center" data-phase="phase-2-command-hierarchy" aria-label="Daily training command center">\n      <div className={styles.header}>',
    '    <section className={styles.root} data-testid="player-daily-command-center" data-phase="phase-2-command-hierarchy" aria-label="Daily training command center">\n      <ShotLabSignatureField variant="court" testId="player-home-signature-field" style={{ position: "absolute", inset: 0, zIndex: 0 }} />\n      <div className={styles.header}>',
    "PlayerDaily signature field",
  );
  writeFileSync(path, source);
}

function patchProgressStory() {
  const path = "src/components/PlayerProgressStory.jsx";
  let source = readFileSync(path, "utf8");
  source = replaceOne(
    source,
    'import styles from "./PlayerProgressStory.module.css";\n',
    'import styles from "./PlayerProgressStory.module.css";\nimport ShotLabSignatureField from "./ShotLabSignatureField.jsx";\n',
    "PlayerProgress signature import",
  );
  source = replaceOne(
    source,
    '      <div className={styles.hero} data-testid="player-progress-story-hero">\n        <div className={styles.heroTopline} data-testid="player-progress-story-topline">',
    '      <div className={styles.hero} data-testid="player-progress-story-hero">\n        <ShotLabSignatureField variant="trajectoryVariant" testId="player-progress-signature-field" style={{ position: "absolute", inset: 0, zIndex: 0 }} />\n        <div className={styles.heroTopline} data-testid="player-progress-story-topline">',
    "PlayerProgress signature field",
  );
  writeFileSync(path, source);
}

function patchAuth() {
  const path = "src/components/AuthWorkspace.jsx";
  let source = readFileSync(path, "utf8");
  source = replaceOne(
    source,
    'import { useState } from "react";\n',
    'import { useState } from "react";\nimport ShotLabSignatureField from "./ShotLabSignatureField.jsx";\n',
    "Auth signature import",
  );
  source = replaceOne(
    source,
    '<div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",background:"radial-gradient(circle at 84% 4%, rgba(126,158,30,.09), transparent 27rem), linear-gradient(180deg,#FAF9F5 0%,#F3F1EA 70%)"}}/>\n<div className="fade-up"',
    '<div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",background:"radial-gradient(circle at 84% 4%, rgba(126,158,30,.09), transparent 27rem), linear-gradient(180deg,#FAF9F5 0%,#F3F1EA 70%)"}}/>\n<ShotLabSignatureField variant="identity" testId="auth-signature-field" style={{position:"fixed",inset:0,zIndex:0,opacity:.72}}/>\n<div className="fade-up"',
    "Auth signature field",
  );
  writeFileSync(path, source);
}

function linkIdentityCss() {
  const path = "index.html";
  let source = readFileSync(path, "utf8");
  const link = '  <link id="shotlab-phase4a-signature-identity" rel="stylesheet" href="/shotlab-phase4a-signature-identity.css" />';
  if (!source.includes('shotlab-phase4a-signature-identity')) {
    const anchor = '  <link id="shotlab-phase3v-final-closure" rel="stylesheet" href="/shotlab-phase3v-final-closure.css" />';
    const count = source.split(anchor).length - 1;
    if (count !== 1) fail(`Phase 3V stylesheet anchor: expected one, found ${count}`);
    source = source.replace(anchor, `${anchor}\n${link}`);
    writeFileSync(path, source);
  }
}

patchPlayerDaily();
patchProgressStory();
patchAuth();
linkIdentityCss();
console.log("Applied Phase 4A signature visual identity.");
