import test from "node:test";
import assert from "node:assert/strict";
import { __testUtils } from "../src/components/useCleanTeamLogo.js";

const {
  findVisibleBounds,
  sampleCornerBackground,
  perimeterBackgroundRatio,
  floodEdgeBackground,
  INSET_BACKGROUND_PERIMETER_RATIO,
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

test("transparent custom logo with an inset gray plate is detected and flood-cleared without deleting the crest", () => {
  const width = 24;
  const height = 24;
  const pixels = imageData(width, height);

  for (let y = 3; y <= 20; y += 1) {
    for (let x = 3; x <= 20; x += 1) paintPixel(pixels.data, width, x, y, [204, 207, 210, 255]);
  }
  for (let y = 7; y <= 17; y += 1) {
    const inset = Math.abs(12 - y) / 2;
    for (let x = Math.ceil(7 + inset); x <= Math.floor(17 - inset); x += 1) paintPixel(pixels.data, width, x, y, [5, 43, 79, 255]);
  }

  const bounds = findVisibleBounds(pixels.data, width, height);
  assert.deepEqual(bounds, { minX: 3, minY: 3, maxX: 20, maxY: 20 });
  const background = sampleCornerBackground(pixels.data, width, height, bounds);
  assert.ok(background);
  assert.ok(perimeterBackgroundRatio(pixels.data, width, bounds, background) >= INSET_BACKGROUND_PERIMETER_RATIO);

  floodEdgeBackground(pixels, width, height, background, bounds);
  assert.equal(pixels.data[(((3 * width) + 3) * 4) + 3], 0, "gray plate becomes transparent");
  assert.equal(pixels.data[(((12 * width) + 12) * 4) + 3], 255, "crest center stays opaque");
});

test("a normal transparent crest does not look like an opaque rectangular plate", () => {
  const width = 24;
  const height = 24;
  const pixels = imageData(width, height);

  for (let y = 4; y <= 19; y += 1) {
    const halfWidth = Math.max(1, Math.floor((19 - y) / 2) + 2);
    for (let x = 12 - halfWidth; x <= 12 + halfWidth; x += 1) paintPixel(pixels.data, width, x, y, [5, 43, 79, 255]);
  }

  const bounds = findVisibleBounds(pixels.data, width, height);
  const candidate = sampleCornerBackground(pixels.data, width, height, bounds);
  const ratio = candidate ? perimeterBackgroundRatio(pixels.data, width, bounds, candidate) : 0;
  assert.ok(ratio < INSET_BACKGROUND_PERIMETER_RATIO);
});
