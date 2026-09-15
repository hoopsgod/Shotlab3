import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const FINAL_COACH_MODE = process.argv.includes("--final-coach");
const COACH_MOBILE_TARGET = /(?:\.mcHeader\[data-testid=(?:["'])?mission-control-team-header(?:["'])?\]|\.mcHero\[data-team-identity-stage=(?:["'])?coach-mission-control(?:["'])?\]|\.mcFocusGrid\b|\.mcActivationChapter\b|\.mcLowerGrid\b)/;

async function removeBundledAuthorityDuplicates() {
  const indexPath = path.join(DIST_DIR, "index.html");
  const html = await readFile(indexPath, "utf8");
  if (!html.includes("data-shotlab-authority-bundle")) return 0;

  const referenced = new Set(
    [...html.matchAll(/href=["'](?:\.\/|\/)?([^"'?]+\.css)(?:\?[^"']*)?["']/gi)]
      .map((match) => path.basename(match[1])),
  );
  const rootEntries = await readdir(DIST_DIR, { withFileTypes: true });
  const staleAuthorities = rootEntries
    .filter((entry) => entry.isFile() && /^shotlab-.*\.css$/i.test(entry.name) && !referenced.has(entry.name))
    .map((entry) => entry.name);

  await Promise.all(staleAuthorities.map((name) => unlink(path.join(DIST_DIR, name))));
  return staleAuthorities.length;
}

async function listCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listCssFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".css")) files.push(fullPath);
  }
  return files;
}

function compactProductionCss(css, filename) {
  return transformCss({
    filename,
    code: Buffer.from(css),
    minify: true,
    sourceMap: false,
    errorRecovery: false,
  }).code.toString("utf8");
}

function restructureCss(css, filename, { coach = false } = {}) {
  return minify(css, {
    filename,
    restructure: true,
    comments: false,
    forceMediaMerge: coach,
  }).css;
}

function isProtectedFinalAuthority(file) {
  return FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file));
}

function isCanonicalCoachMobileSelector(selector) {
  const normalized = selector.replace(/\s+/g, " ").trim();
  return normalized.includes(".mcShellV3.is-mobile-shell") && COACH_MOBILE_TARGET.test(normalized);
}

function extractCoachMobileAuthority(css, filename) {
  const rules = [];
  const stripped = css.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, body) => {
    if (!isCanonicalCoachMobileSelector(selector)) return match;
    rules.push(`${selector.trim()}{${body}}`);
    return "";
  });

  if (rules.length < 8) {
    throw new Error(`Missing canonical Coach mobile authority before final CSS restructure: ${filename} (${rules.length} rule(s) found)`);
  }
  return { css: stripped, rules };
}

function assertCoachMobileAuthoritySurvives(css, filename) {
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1].replace(/\s+/g, " ").trim(),
    body: match[2].replace(/\s+/g, ""),
  }));
  const hasContract = (selectorPattern, declarationPattern) => blocks.some(({ selector, body }) => (
    selector.includes(".mcShellV3.is-mobile-shell")
    && selectorPattern.test(selector)
    && declarationPattern.test(body)
  ));
  const required = [
    hasContract(/\.mcHeader\[data-testid=(?:["'])?mission-control-team-header(?:["'])?\]/, /display:none(?:;|$)/),
    hasContract(/\.mcHero\[data-team-identity-stage=(?:["'])?coach-mission-control(?:["'])?\](?:\s|,|$)/, /min-height:334px(?:;|$)/),
    hasContract(/\.mcHeroIdentity\b/, /--coach-hero-crest:clamp\(104px,29vw,120px\)(?:;|$)/),
    hasContract(/\.mcFocusGrid\b/, /margin-inline:0(?:;|$)/),
  ];
  if (required.some((present) => !present)) {
    throw new Error(`Canonical Coach mobile authority was lost during final CSS restructure: ${filename}`);
  }
}

async function finalizeProductionCss(files) {
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let protectedFiles = 0;
  let protectedCoachRules = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(DIST_DIR, file);
    if (isProtectedFinalAuthority(file)) {
      sourceBytes += Buffer.byteLength(source);
      outputBytes += Buffer.byteLength(source);
      protectedFiles += 1;
      continue;
    }

    const isCoachWorkspace = COACH_WORKSPACE_ASSET.test(path.basename(file));
    let workingSource = source;
    let coachMobileRules = [];
    if (isCoachWorkspace) {
      const extracted = extractCoachMobileAuthority(source, relative);
      workingSource = extracted.css;
      coachMobileRules = extracted.rules;
      protectedCoachRules += coachMobileRules.length;
    }

    // Re-run CSSO after selector/font dedupe so the large production stylesheet
    // retains budget headroom. Canonical Coach mobile rules are extracted by
    // selector rather than source order because earlier optimizer passes may merge
    // or reorder them. Keep the restored rules out of another whole-block optimizer
    // pass so their selector boundaries remain stable for exact-head certification.
    const restructured = restructureCss(workingSource, relative, { coach: false });
    let output = compactProductionCss(restructured, path.basename(file));
    if (coachMobileRules.length) {
      const restoredAuthority = `@media(max-width:700px){${coachMobileRules.join("")}}`;
      output += restoredAuthority;
      assertCoachMobileAuthoritySurvives(output, relative);
    }

    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Final production CSS restructure changed ${changedFiles}/${files.length} files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw after selector/dedupe passes; protected ${protectedFiles} final mobile authority asset(s) and ${protectedCoachRules} canonical Coach mobile rule(s).`);
}

async function main() {
  await stat(DIST_DIR);

  if (FINAL_COACH_MODE) {
    const files = await listCssFiles(DIST_DIR);
    await finalizeProductionCss(files);
    return;
  }

  // Remove unreferenced authority copies before enumerating the files that will be
  // restructured. A retired stylesheet can be present in dist after Vite copies
  // public assets but intentionally absent from index.html; listing first leaves a
  // stale pathname that is unlinked moments later and then crashes the optimizer.
  const removedAuthorityCopies = await removeBundledAuthorityDuplicates();
  const files = await listCssFiles(DIST_DIR);
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let protectedFiles = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (isProtectedFinalAuthority(file)) {
      sourceBytes += Buffer.byteLength(source);
      outputBytes += Buffer.byteLength(source);
      protectedFiles += 1;
      continue;
    }
    const isCoachWorkspace = COACH_WORKSPACE_ASSET.test(path.basename(file));
    const output = restructureCss(source, path.relative(DIST_DIR, file), { coach: isCoachWorkspace });
    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Removed ${removedAuthorityCopies} unreferenced visual-authority CSS copies.`);
  console.log(`Restructured ${changedFiles}/${files.length} production CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw; protected ${protectedFiles} final mobile authority asset(s).`);
}

await main();
