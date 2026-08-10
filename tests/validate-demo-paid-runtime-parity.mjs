import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "artifacts/demo-paid-runtime-parity");
const ROLES = ["coach", "player"];
const MODES = ["demo", "registered"];
const COLOR_FIELDS = new Set(["color", "backgroundColor", "borderTopColor"]);

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function normalizeColor(value) {
  if (typeof value !== "string") return value;
  return value.replace(/-?(?:\d+\.\d+|\.\d+)/g, (token) => {
    const rounded = Number(token).toFixed(4);
    return String(Number(rounded));
  });
}

function normalizeFingerprint(value, key = "") {
  if (Array.isArray(value)) return value.map((entry) => normalizeFingerprint(entry));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, normalizeFingerprint(childValue, childKey)]),
    );
  }
  return COLOR_FIELDS.has(key) ? normalizeColor(value) : value;
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
      `${role}/${route} computed UI differs after insignificant CSS color serialization is normalized`,
    );

    assert.equal(
      hashFile(registeredPngPath),
      hashFile(demoPngPath),
      `${role}/${route} rendered screenshot pixels differ between demo and registered`,
    );
  }

  console.log(`Runtime parity verified for ${role}: ${demoJsonRoutes.length} destinations, normalized computed UI + exact screenshot bytes.`);
}

console.log("Demo/registered runtime parity evidence is exact at the rendered-pixel level.");
