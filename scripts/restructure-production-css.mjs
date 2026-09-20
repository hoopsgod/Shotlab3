import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const FINAL_COACH_MODE = process.argv.includes("--final-coach");
const POST_AUTH_FONTS_MODE = process.argv.includes("--post-auth-fonts");
const COACH_MOBILE_MEDIA = /@media\s*\(\s*max-width\s*:\s*700px\s*\)\s*\{/g;
const COACH_AUTHORITY_MARKERS = [
  "coach-mission-control",
  "mission-control-team-header",
  "--coach-hero-crest:clamp(104px,29vw,120px)",
  "min-height:334px",
  "min-height:48px",
  "min-height:50px",
];

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

function isCoachWorkspace(file) {
  return COACH_WORKSPACE_ASSET.test(path.basename(file));
}

function restructureCss(css, filename, { coach = false } = {}) {
  return minify(css, {
    filename,
    restructure: true,
    comments: false,
    forceMediaMerge: coach,
  }).css;
}

function findBalancedBlockEnd(css, start) {
  const open = css.indexOf("{", start);
  if (open < 0) return -1;
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}" && --depth === 0) return i + 1;
  }
  return -1;
}

function extractCanonicalCoachMobileAuthority(css) {
  COACH_MOBILE_MEDIA.lastIndex = 0;
  for (const match of css.matchAll(COACH_MOBILE_MEDIA)) {
    const start = match.index;
    const end = findBalancedBlockEnd(css, start);
    if (end < 0) throw new Error("Unbalanced Coach mobile media block during production CSS optimization.");
    const block = css.slice(start, end);
    if (!COACH_AUTHORITY_MARKERS.every((marker) => block.includes(marker))) continue;
    return { start, end, block };
  }
  throw new Error("Canonical Coach <=700px authority block was not found before production CSS optimization.");
}

function protectedCoachProperties(selector) {
  const normalized = selector.replace(/\s+/g, " ").trim();
  if (normalized.includes("mission-control-team-header")) return new Set(["display"]);
  if (/\[data-team-identity-stage=(?:["'])?coach-mission-control(?:["'])?\]$/.test(normalized)) {
    return new Set(["min-height"]);
  }
  if (normalized.includes(".mcHeroContent>p") || normalized.includes(".mcHeroContent > p")) return "all";
  if (normalized.endsWith(".mcHeroContent")) return new Set(["min-height", "padding"]);
  if (normalized.endsWith(".mcHeroIdentity")) return "all";
  if (normalized.endsWith(".mcHeroTeamMark")) return "all";
  if (normalized.endsWith(".mcProgramIdentity")) return "all";
  if (normalized.endsWith(".mcEyebrow")) return "all";
  if (/\sh1$/.test(normalized)) return "all";
  if (normalized.endsWith(".mcRealityStrip button")) return new Set(["min-height", "padding"]);
  if (normalized.endsWith(".mcRealityStrip strong")) return "all";
  if (normalized.endsWith(".mcPrimary")) return new Set(["min-height", "margin-top", "padding", "font-size"]);
  return null;
}

function splitDeclarations(body, protectedProperties) {
  if (protectedProperties === "all") return { protectedBody: body.trim(), compressibleBody: "" };
  if (!protectedProperties) return { protectedBody: "", compressibleBody: body.trim() };

  const protectedDeclarations = [];
  const compressibleDeclarations = [];
  const declarationPattern = /([-a-zA-Z0-9_]+)\s*:\s*([^;}]*)/g;
  for (const match of body.matchAll(declarationPattern)) {
    const declaration = `${match[1]}:${match[2].trim()}`;
    if (protectedProperties.has(match[1].toLowerCase())) protectedDeclarations.push(declaration);
    else compressibleDeclarations.push(declaration);
  }
  return {
    protectedBody: protectedDeclarations.join(";"),
    compressibleBody: compressibleDeclarations.join(";"),
  };
}

function partitionCoachMobileAuthority(block) {
  const open = block.indexOf("{");
  const close = block.lastIndexOf("}");
  if (open < 0 || close < 0 || close <= open) {
    throw new Error("Canonical Coach mobile block is unbalanced before declaration-level authority isolation.");
  }

  const mediaHeader = block.slice(0, open + 1);
  const inner = block.slice(open + 1, close);
  const protectedRules = [];
  const compressibleRules = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;

  for (const match of inner.matchAll(rulePattern)) {
    const selector = match[1].trim();
    const body = match[2].trim();
    const { protectedBody, compressibleBody } = splitDeclarations(body, protectedCoachProperties(selector));
    if (protectedBody) protectedRules.push(`${selector}{${protectedBody}}`);
    if (compressibleBody) compressibleRules.push(`${selector}{${compressibleBody}}`);
  }

  if (!protectedRules.length) {
    throw new Error("Canonical Coach mobile block produced no protected title-stage declarations.");
  }
  return {
    protectedTitleStage: `${mediaHeader}${protectedRules.join("")}}`,
    compressibleMobileAuthority: compressibleRules.length
      ? `${mediaHeader}${compressibleRules.join("")}}`
      : "",
  };
}

function compactCoachCssPreservingAuthority(css, filename) {
  const { start, end, block } = extractCanonicalCoachMobileAuthority(css);
  const { protectedTitleStage, compressibleMobileAuthority } = partitionCoachMobileAuthority(block);
  const remainder = `${css.slice(0, start)}${compressibleMobileAuthority}${css.slice(end)}`;

  // The historical Coach bundle needs whole-bundle CSSO restructuring to stay
  // inside the locked performance budget. Remove only the declarations whose
  // responsive association CSSO has proven unsafe to merge, compact every
  // remaining declaration normally, then append those source-derived
  // declarations as the final <=700px Coach title-stage authority.
  const compactRemainder = compactProductionCss(
    restructureCss(remainder, `${filename}:without-coach-title-stage-authority`, { coach: true }),
    path.basename(filename),
  );
  const compactAuthority = minify(protectedTitleStage, {
    filename: `${filename}:coach-title-stage-authority`,
    // This isolated block contains only the <=700px source authority, so CSSO
    // can safely restructure within it without merging across breakpoints.
    restructure: true,
    comments: false,
    forceMediaMerge: false,
  }).css;
  return `${compactRemainder}${compactAuthority}`;
}

function isProtectedFinalAuthority(file) {
  return FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file));
}

function optimizeCss(source, relative) {
  if (isCoachWorkspace(relative)) return compactCoachCssPreservingAuthority(source, relative);
  return compactProductionCss(restructureCss(source, relative), path.basename(relative));
}

async function finalizeProductionCss(files, mode) {
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let protectedFiles = 0;
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(DIST_DIR, file);
    if (isProtectedFinalAuthority(file)) {
      if (mode !== "post-auth-fonts") {
        sourceBytes += Buffer.byteLength(source);
        outputBytes += Buffer.byteLength(source);
        protectedFiles += 1;
        continue;
      }

      // The final mobile-axis authority is isolated and loaded last. Give it
      // one standards-based structural compaction only after every other CSS
      // transform has finished; browser geometry/parity suites certify that
      // the resulting cascade is unchanged.
      const output = compactProductionCss(
        restructureCss(source, `${relative}:final-mobile-axis`),
        path.basename(file),
      );
      sourceBytes += Buffer.byteLength(source);
      outputBytes += Buffer.byteLength(output);
      if (output !== source) {
        await writeFile(file, output);
        changedFiles += 1;
      }
      continue;
    }

    const output = optimizeCss(source, relative);
    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }
  console.log(
    `${mode === "post-auth-fonts" ? "Post-font" : "Final"} production CSS restructure changed ${changedFiles}/${files.length} files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw after selector/dedupe passes; protected ${protectedFiles} final mobile authority asset(s).`,
  );
}

async function main() {
  await stat(DIST_DIR);
  if (FINAL_COACH_MODE || POST_AUTH_FONTS_MODE) {
    const files = await listCssFiles(DIST_DIR);
    await finalizeProductionCss(files, POST_AUTH_FONTS_MODE ? "post-auth-fonts" : "final-coach");
    return;
  }

  const removedAuthorityCopies = await removeBundledAuthorityDuplicates();
  const files = await listCssFiles(DIST_DIR);
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let protectedFiles = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(DIST_DIR, file);
    if (isProtectedFinalAuthority(file)) {
      sourceBytes += Buffer.byteLength(source);
      outputBytes += Buffer.byteLength(source);
      protectedFiles += 1;
      continue;
    }

    const output = isCoachWorkspace(file)
      ? compactCoachCssPreservingAuthority(source, relative)
      : restructureCss(source, relative);
    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Removed ${removedAuthorityCopies} unreferenced visual-authority CSS copies.`);
  console.log(
    `Restructured ${changedFiles}/${files.length} production CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw; protected ${protectedFiles} final mobile authority asset(s).`,
  );
}

await main();
