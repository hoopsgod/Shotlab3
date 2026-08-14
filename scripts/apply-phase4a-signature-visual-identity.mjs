import { readFileSync, writeFileSync } from "node:fs";

const fail = (message) => { throw new Error(`[phase4a-signature-visual-identity] ${message}`); };
const replaceOne = (source, from, to, label) => {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) fail(`${label}: expected one anchor, found ${count}`);
  return source.replace(from, to);
};
const insertAfterOne = (source, anchor, insertion, marker, label) => {
  if (source.includes(marker)) return source;
  const flags = anchor.flags.includes("g") ? anchor.flags : `${anchor.flags}g`;
  const count = [...source.matchAll(new RegExp(anchor.source, flags))].length;
  if (count !== 1) fail(`${label}: expected one anchor, found ${count}`);
  return source.replace(anchor, (match) => `${match}${insertion}`);
};
const ensureImportAfter = (source, anchor, importStatement, label) => {
  if (source.includes(importStatement)) return source;
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected one anchor, found ${count}`);
  return source.replace(anchor, `${anchor}${importStatement}`);
};

function patchPlayerDaily() {
  const path = "src/components/PlayerDailyCommandCenter.jsx";
  let source = readFileSync(path, "utf8");
  source = ensureImportAfter(
    source,
    'import ShotLabIcon from "./ShotLabIcon";\n',
    'import ShotLabSignatureField from "./ShotLabSignatureField.jsx";\n',
    "PlayerDaily signature import",
  );
  source = insertAfterOne(
    source,
    /^[ \t]*<section\b(?=[^>\n]*data-testid="player-daily-command-center")[^>\n]*>\r?\n(?=[ \t]*<div className=\{styles\.header\} data-layout-role="editorial-header">)/m,
    '      <ShotLabSignatureField variant="court" testId="player-home-signature-field" style={{ position: "absolute", inset: 0, zIndex: 0 }} />\n',
    'testId="player-home-signature-field"',
    "PlayerDaily signature field",
  );
  writeFileSync(path, source);
}

function patchProgressStory() {
  const path = "src/components/PlayerProgressStory.jsx";
  let source = readFileSync(path, "utf8");
  source = ensureImportAfter(
    source,
    'import styles from "./PlayerProgressStory.module.css";\n',
    'import ShotLabSignatureField from "./ShotLabSignatureField.jsx";\n',
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
  source = ensureImportAfter(
    source,
    'import { useState } from "react";\n',
    'import ShotLabSignatureField from "./ShotLabSignatureField.jsx";\n',
    "Auth signature import",
  );
  source = insertAfterOne(
    source,
    /^<div aria-hidden="true"(?=[^>\n]*position:"fixed")[^>\n]*\/>\r?\n(?=<div className="fade-up")/m,
    '<ShotLabSignatureField variant="identity" testId="auth-signature-field" style={{position:"fixed",inset:0,zIndex:0,opacity:.72}}/>\n',
    'testId="auth-signature-field"',
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
