import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const ROOT = process.cwd();
const coachFiles = [
  "src/components/CoachMissionControlV2.css",
  "src/components/CoachMissionControlShell.css",
  "src/components/CoachMissionControlHeader.css",
  "src/components/CoachMissionControlPolish.css",
  "src/components/CoachMissionControl2026.css",
  "src/components/CoachMissionControlFinal.css",
  "src/components/CoachActivationPath.css",
  "src/components/CoachPriorityOverlay.css",
];
const playerFiles = [
  "src/components/ShotLabStatePanel.module.css",
  "src/components/ShotLabSignatureField.module.css",
  "src/components/VisualHierarchy.module.css",
  "src/components/ShotLabPerformanceMark.module.css",
  "src/components/MobileNavigation.module.css",
  "src/components/MobileNavigationArchitecture.css",
  "src/components/DashboardIdentityHeader.module.css",
  "src/components/SemanticStatus.module.css",
  "src/components/OperationalInsightRail.module.css",
  "src/components/CoachDashboardPrimitives.module.css",
  "src/components/PlayerDailyPrimitives.module.css",
  "src/components/PlayerDailyCommandCenter.module.css",
  "src/components/PlayerProgressStory.module.css",
  "src/components/PlayerCommitmentCenter.module.css",
  "src/components/PlayerTrainingSessionHeader.module.css",
  "src/components/PlayerSessionCloseout.module.css",
  "src/components/PlayerTrainingCompletion.module.css",
  "src/components/PlayerOperationalWorkspace.module.css",
  "src/components/PlayerMetricHierarchy.module.css",
  "src/components/PlayerCoachAssignmentCard.module.css",
];

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseDeclarations(css) {
  const map = new Map();
  const clean = stripComments(css);
  const ruleRe = /([^{}@]+)\{([^{}]*)\}/g;
  for (const match of clean.matchAll(ruleRe)) {
    const selector = match[1].trim().replace(/\s+/g, " ");
    if (!selector) continue;
    const declarations = match[2].split(";").map((item) => item.trim()).filter(Boolean);
    for (const declaration of declarations) {
      const colon = declaration.indexOf(":");
      if (colon <= 0) continue;
      const property = declaration.slice(0, colon).trim().toLowerCase();
      const value = declaration.slice(colon + 1).trim();
      map.set(`${selector}\u0000${property}`, value);
    }
  }
  return map;
}

function classNames(css) {
  return new Set([...stripComments(css).matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((m) => m[1]));
}

async function sourceCorpus() {
  const { readdir } = await import("node:fs/promises");
  async function list(dir) {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...await list(full));
      else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) out.push(full);
    }
    return out;
  }
  const files = await list(path.join(ROOT, "src"));
  return (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
}

async function inspectGroup(label, files, corpus) {
  const entries = [];
  for (const file of files) {
    const css = await readFile(path.join(ROOT, file), "utf8");
    entries.push({ file, css, declarations: parseDeclarations(css), classes: classNames(css) });
  }
  console.log(`\n${label}`);
  console.log("-".repeat(label.length));
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const laterKeys = new Set();
    for (let cursor = index + 1; cursor < entries.length; cursor += 1) {
      for (const key of entries[cursor].declarations.keys()) laterKeys.add(key);
    }
    const superseded = [...entry.declarations.keys()].filter((key) => laterKeys.has(key)).length;
    const unusedClasses = [...entry.classes].filter((name) => !corpus.includes(name));
    const raw = Buffer.byteLength(entry.css);
    const gzip = gzipSync(entry.css).length;
    console.log(`${entry.file}: raw ${(raw/1024).toFixed(1)} KiB, gzip ${(gzip/1024).toFixed(1)} KiB, declarations ${entry.declarations.size}, later-overlap ${superseded} (${entry.declarations.size ? Math.round(superseded/entry.declarations.size*100) : 0}%), classes ${entry.classes.size}, source-unreferenced classes ${unusedClasses.length}`);
    if (unusedClasses.length) console.log(`  unused: ${unusedClasses.slice(0, 18).join(", ")}${unusedClasses.length > 18 ? " …" : ""}`);
  }
}

const corpus = await sourceCorpus();
await inspectGroup("Coach Mission Control CSS generations", coachFiles, corpus);
await inspectGroup("Player/shared interface CSS modules", playerFiles, corpus);
