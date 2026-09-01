import test from "node:test";
import assert from "node:assert/strict";
import { __testUtils } from "../src/components/useCleanTeamLogo.js";

const {
  findVisibleBounds,
  sampleCornerBackground,
  floodEdgeBackground,
  INSET_SAMPLE_ALPHA,
} = __testUtils;

function imageData(width, height) {
  return { data: new Uint8ClampedArray(width * height * 4) };
}

function paintPixel(data, width, x, y, [r, g, b, a = 255]) {
  const offset = ((y * width) + x) * 4;
  data[offset] = r;
  data[offset + 1] = g;
  data[offset + 2] = b;
  data[offset + 3] = a;
}

function paintCrest(pixels, width) {
  for (let y = 17; y <= 47; y += 1) {
    const inset = Math.abs(32 - y) / 2;
    for (let x = Math.ceil(18 + inset); x <= Math.floor(46 - inset); x += 1) {
      paintPixel(pixels.data, width, x, y, [5, 43, 79, 255]);
    }
  }
}

test("transparent custom logo with an inset gray plate is detected and flood-cleared without deleting the crest", () => {
  const width = 64;
  const height = 64;
  const pixels = imageData(width, height);

  for (let y = 5; y <= 58; y += 1) {
    for (let x = 5; x <= 58; x += 1) paintPixel(pixels.data, width, x, y, [204, 207, 210, 255]);
  }
  paintCrest(pixels, width);

  const bounds = findVisibleBounds(pixels.data, width, height);
  assert.deepEqual(bounds, { minX: 5, minY: 5, maxX: 58, maxY: 58 });
  const background = sampleCornerBackground(pixels.data, width, height, bounds);
  assert.ok(background);
  assert.equal(background.sampledCorners, 4);

  floodEdgeBackground(pixels, width, height, background, bounds);
  assert.equal(pixels.data[(((5 * width) + 5) * 4) + 3], 0, "gray plate becomes transparent");
  assert.equal(pixels.data[(((32 * width) + 32) * 4) + 3], 255, "crest center stays opaque");
});

test("a semi-transparent gray plate is removed so it cannot reappear on tinted secondary pages", () => {
  const width = 64;
  const height = 64;
  const pixels = imageData(width, height);

  for (let y = 5; y <= 58; y += 1) {
    for (let x = 5; x <= 58; x += 1) paintPixel(pixels.data, width, x, y, [204, 207, 210, 92]);
  }
  paintCrest(pixels, width);

  const bounds = findVisibleBounds(pixels.data, width, height);
  assert.deepEqual(bounds, { minX: 5, minY: 5, maxX: 58, maxY: 58 });
  const background = sampleCornerBackground(pixels.data, width, height, bounds, INSET_SAMPLE_ALPHA);
  assert.ok(background, "low-alpha flat plate should still be sampled");
  assert.equal(background.sampledCorners, 4, "the flat plate should occupy every visible corner region");

  floodEdgeBackground(pixels, width, height, background, bounds);
  assert.equal(pixels.data[(((5 * width) + 5) * 4) + 3], 0, "faded gray plate becomes fully transparent");
  assert.equal(pixels.data[(((32 * width) + 32) * 4) + 3], 255, "crest center stays opaque");
});

test("a normal transparent crest does not look like a rectangular background plate", () => {
  const width = 64;
  const height = 64;
  const pixels = imageData(width, height);

  for (let y = 8; y <= 55; y += 1) {
    const halfWidth = Math.max(2, Math.floor((55 - y) / 3) + 4);
    for (let x = 32 - halfWidth; x <= 32 + halfWidth; x += 1) paintPixel(pixels.data, width, x, y, [5, 43, 79, 255]);
  }

  const bounds = findVisibleBounds(pixels.data, width, height);
  const candidate = sampleCornerBackground(pixels.data, width, height, bounds, INSET_SAMPLE_ALPHA);
  assert.ok(!candidate || candidate.sampledCorners < 3);
});
