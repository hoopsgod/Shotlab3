import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const ROOT = path.resolve(process.cwd(), "artifacts/demo-paid-runtime-parity");
const ROLES = ["coach", "player"];
const COLOR_FIELDS = new Set(["color", "backgroundColor", "borderTopColor"]);
const MAX_DIFFERENT_PIXEL_RATIO = 0.002;
const MAX_MEAN_CHANNEL_DELTA = 0.1;

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

function compareRenderedPixels(demoPath, registeredPath, label) {
  const demo = PNG.sync.read(fs.readFileSync(demoPath));
  const registered = PNG.sync.read(fs.readFileSync(registeredPath));
  assert.equal(registered.width, demo.width, `${label} screenshot width differs`);
  assert.equal(registered.height, demo.height, `${label} screenshot height differs`);

  const pixelCount = demo.width * demo.height;
  let differentPixels = 0;
  let totalChannelDelta = 0;

  for (let offset = 0; offset < demo.data.length; offset += 4) {
    let pixelDifferent = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(demo.data[offset + channel] - registered.data[offset + channel]);
      totalChannelDelta += delta;
      if (delta !== 0) pixelDifferent = true;
    }
    if (pixelDifferent) differentPixels += 1;
  }

  const differentPixelRatio = differentPixels / pixelCount;
  const meanChannelDelta = totalChannelDelta / (pixelCount * 4);
  assert.ok(
    differentPixelRatio <= MAX_DIFFERENT_PIXEL_RATIO,
    `${label} rendered pixel drift is ${(differentPixelRatio * 100).toFixed(4)}%, above ${(MAX_DIFFERENT_PIXEL_RATIO * 100).toFixed(2)}%`,
  );
  assert.ok(
    meanChannelDelta <= MAX_MEAN_CHANNEL_DELTA,
    `${label} mean rendered channel drift is ${meanChannelDelta.toFixed(4)}, above ${MAX_MEAN_CHANNEL_DELTA}`,
  );
  return { differentPixels, pixelCount, differentPixelRatio, meanChannelDelta };
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

  let roleDifferentPixels = 0;
  let rolePixelCount = 0;
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

    // Chromium can serialize equivalent colors differently and can rasterize a
    // few antialiased/animated edge pixels differently between isolated browser
    // contexts. Bound the actual paint drift tightly instead of requiring PNG
    // byte identity, while the computed UI contract above remains exact.
    const rendered = compareRenderedPixels(demoPngPath, registeredPngPath, `${role}/${route}`);
    roleDifferentPixels += rendered.differentPixels;
    rolePixelCount += rendered.pixelCount;
  }

  console.log(
    `Runtime parity verified for ${role}: ${demoJsonRoutes.length} destinations; exact non-color computed UI; `
      + `${roleDifferentPixels}/${rolePixelCount} rendered pixels differ within bounded antialias/motion tolerance.`,
  );
}

console.log("Demo/registered runtime parity is verified across the complete Coach and Player route matrices.");
