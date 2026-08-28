import { readFileSync, writeFileSync } from "node:fs";

const fail = (message) => { throw new Error(`[phase4a-signature-visual-identity] ${message}`); };
function readNormalized(path) {
  const raw = readFileSync(path, "utf8");
  return { source: raw.replace(/\r\n/g, "\n"), lineEnding: raw.includes("\r\n") ? "\r\n" : "\n" };
}
function writeNormalized(path, source, lineEnding) {
  writeFileSync(path, source.replace(/\n/g, lineEnding));
}
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
  const file = readNormalized(path);
  let source = file.source;
  source = ensureImportAfter(
    source,
    'import ShotLabIcon from "./ShotLabIcon";\n',
    'import ShotLabSignatureField from "./ShotLabSignatureField.jsx";\n',
    "PlayerDaily signature import",
  );
  source = insertAfterOne(
    source,
    /^[ \t]*<section\b(?=[^>\n]*data-testid="player-daily-command-center")[^>\n]*>\r?\n/m,
    '      <ShotLabSignatureField variant="court" testId="player-home-signature-field" style={{ position: "absolute", inset: 0, zIndex: 0 }} />\n',
    'testId="player-home-signature-field"',
    "PlayerDaily signature field",
  );
  writeNormalized(path, source, file.lineEnding);
}

function patchProgressStory() {
  const path = "src/components/PlayerProgressStory.jsx";
  const file = readNormalized(path);
  let source = file.source;
  source = ensureImportAfter(
    source,
    'import styles from "./PlayerProgressStory.module.css";\n',
    'import ShotLabSignatureField from "./ShotLabSignatureField.jsx";\n',
    "PlayerProgress signature import",
  );
  source = insertAfterOne(
    source,
    /^[ \t]*<div\b(?=[^>\n]*className=\{styles\.hero\})(?=[^>\n]*data-testid="player-progress-story-hero")[^>\n]*>\r?\n/m,
    '        <ShotLabSignatureField variant="trajectoryVariant" testId="player-progress-signature-field" style={{ position: "absolute", inset: 0, zIndex: 0 }} />\n',
    'testId="player-progress-signature-field"',
    "PlayerProgress signature field",
  );
  writeNormalized(path, source, file.lineEnding);
}

function patchAuth() {
  const path = "src/components/AuthWorkspace.jsx";
  const file = readNormalized(path);
  let source = file.source;
  const authReactImport = [
    'import { useRef, useState } from "react";\n',
    'import { useState } from "react";\n',
  ].find((anchor) => source.includes(anchor));
  if (!authReactImport) fail("Auth signature import: React state import anchor not found");
  source = ensureImportAfter(
    source,
    authReactImport,
    'import ShotLabSignatureField from "./ShotLabSignatureField.jsx";\n',
    "Auth signature import",
  );
  source = replaceOne(
    source,
    '<div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",background:"radial-gradient(circle at 84% 4%, rgba(126,158,30,.09), transparent 27rem), linear-gradient(180deg,#FAF9F5 0%,#F3F1EA 70%)"}}/>\n<div className="fade-up"',
    '<div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",background:"radial-gradient(circle at 84% 4%, rgba(126,158,30,.09), transparent 27rem), linear-gradient(180deg,#FAF9F5 0%,#F3F1EA 70%)"}}/>\n<ShotLabSignatureField variant="identity" testId="auth-signature-field" style={{position:"fixed",inset:0,zIndex:0,opacity:.72}}/>\n<div className="fade-up"',
    "Auth signature field",
  );
  writeNormalized(path, source, file.lineEnding);
}

function linkIdentityCss() {
  const path = "index.html";
  const file = readNormalized(path);
  let source = file.source;
  const link = '  <link id="shotlab-phase4a-signature-identity" rel="stylesheet" href="/shotlab-phase4a-signature-identity.css" />';
  if (!source.includes('shotlab-phase4a-signature-identity')) {
    const anchor = '  <link id="shotlab-phase3v-final-closure" rel="stylesheet" href="/shotlab-phase3v-final-closure.css" />';
    const count = source.split(anchor).length - 1;
    if (count !== 1) fail(`Phase 3V stylesheet anchor: expected one, found ${count}`);
    source = source.replace(anchor, `${anchor}\n${link}`);
    writeNormalized(path, source, file.lineEnding);
  }
}

patchPlayerDaily();
patchProgressStory();
patchAuth();
linkIdentityCss();
console.log("Applied Phase 4A signature visual identity.");
