import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const listingPath = path.join(root, "native/app-store-listing.json");
const outputDir = path.resolve(root, process.argv[2] || "artifacts/app-store/iphone-6.9");
const listing = JSON.parse(fs.readFileSync(listingPath, "utf8"));
const screenshotPlan = listing.screenshots;

const fail = (message) => {
  throw new Error(`[app-store-screenshots] ${message}`);
};

const SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function readJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) fail("File is not a JPEG image.");
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0x01) continue;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > buffer.length) break;
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) fail("JPEG segment is malformed.");
    if (SOF_MARKERS.has(marker)) {
      if (segmentLength < 7) fail("JPEG frame header is malformed.");
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }
  fail("JPEG dimensions could not be resolved.");
}

if (!fs.existsSync(outputDir)) fail(`Screenshot directory does not exist: ${outputDir}`);

const expectedFiles = screenshotPlan.items.map((item) => item.file);
const actualJpegs = fs.readdirSync(outputDir).filter((file) => /\.jpe?g$/i.test(file)).sort();
if (actualJpegs.length !== screenshotPlan.count) {
  fail(`Expected ${screenshotPlan.count} JPEG files, found ${actualJpegs.length}.`);
}

const unexpected = actualJpegs.filter((file) => !expectedFiles.includes(file));
const missing = expectedFiles.filter((file) => !actualJpegs.includes(file));
if (unexpected.length) fail(`Unexpected screenshots: ${unexpected.join(", ")}`);
if (missing.length) fail(`Missing screenshots: ${missing.join(", ")}`);

const results = expectedFiles.map((file) => {
  const filePath = path.join(outputDir, file);
  const buffer = fs.readFileSync(filePath);
  const dimensions = readJpegDimensions(buffer);
  if (dimensions.width !== screenshotPlan.width || dimensions.height !== screenshotPlan.height) {
    fail(`${file} is ${dimensions.width}x${dimensions.height}; expected ${screenshotPlan.width}x${screenshotPlan.height}.`);
  }
  if (buffer.length < 150_000) fail(`${file} is unexpectedly small (${buffer.length} bytes).`);
  return { file, ...dimensions, bytes: buffer.length, alpha: false, format: "jpeg" };
});

const validationPath = path.join(outputDir, "screenshot-validation.json");
fs.writeFileSync(validationPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  display: screenshotPlan.display,
  expected: { width: screenshotPlan.width, height: screenshotPlan.height, count: screenshotPlan.count, format: screenshotPlan.format },
  screenshots: results,
}, null, 2)}\n`);

console.log(`[app-store-screenshots] Validated ${results.length} screenshots at ${screenshotPlan.width}x${screenshotPlan.height}.`);
