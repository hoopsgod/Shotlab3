import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "artifacts/demo-paid-runtime-parity");
const ROLES = ["coach", "player"];
const COLOR_FIELDS = new Set(["color", "backgroundColor", "borderTopColor"]);

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function normalizeFingerprint(value) {
  if (Array.isArray(value)) return value.map((entry) => normalizeFingerprint(entry));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !COLOR_FIELDS.has(key))
        .map(([key, childValue]) => [key, normalizeFingerprint(childValue)]),
    );
  }
  return value;
}

function routeNames(role, mode, extension) {
  const dir = path.join(ROOT, role, mode);
  assert.ok(fs.existsSync(dir), `Missing parity evidence directory: ${dir}`);
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(extension))
    .map((name) => name.slice(0, -extension.length))
    .sort();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

assert.ok(fs.existsSync(ROOT), `Missing runtime parity evidence at ${ROOT}`);

for (const role of ROLES) {
  const demoJsonRoutes = routeNames(role, "demo", ".json");
  const registeredJsonRoutes = routeNames(role, "registered", ".json");
  const demoPngRoutes = routeNames(role, "demo", ".png");
  const registeredPngRoutes = routeNames(role, "registered", ".png");

  assert.deepEqual(registeredJsonRoutes, demoJsonRoutes, `${role} JSON route matrix differs between demo and registered`);
  assert.deepEqual(demoPngRoutes, demoJsonRoutes, `${role} demo screenshot route matrix is incomplete`);
  assert.deepEqual(registeredPngRoutes, demoJsonRoutes, `${role} registered screenshot route matrix is incomplete`);
  assert.ok(demoJsonRoutes.length >= 5, `${role} parity evidence must cover at least five destinations`);

  for (const route of demoJsonRoutes) {
    const demoJsonPath = path.join(ROOT, role, "demo", `${route}.json`);
    const registeredJsonPath = path.join(ROOT, role, "registered", `${route}.json`);
    const demoPngPath = path.join(ROOT, role, "demo", `${route}.png`);
    const registeredPngPath = path.join(ROOT, role, "registered", `${route}.png`);

    const demoFingerprint = normalizeFingerprint(readJson(demoJsonPath));
    const registeredFingerprint = normalizeFingerprint(readJson(registeredJsonPath));
    assert.deepEqual(
      registeredFingerprint,
      demoFingerprint,
      `${role}/${route} structure, geometry, typography, spacing, or state differs between demo and registered`,
    );

    // Chromium may serialize the same rendered color through different CSS color
    // spaces (for example rgb() vs oklab()). Exact screenshot bytes are the
    // authoritative color/paint check; any real visual color drift fails here.
    assert.equal(
      hashFile(registeredPngPath),
      hashFile(demoPngPath),
      `${role}/${route} rendered screenshot pixels differ between demo and registered`,
    );
  }

  console.log(`Runtime parity verified for ${role}: ${demoJsonRoutes.length} destinations, identical non-color computed UI + exact screenshot bytes.`);
}

console.log("Demo/registered runtime parity evidence is exact at the rendered-pixel level.");
