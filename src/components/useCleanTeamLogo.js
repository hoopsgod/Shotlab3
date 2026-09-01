import { useEffect, useState } from "react";

const logoCache = new Map();
const MAX_LOGO_SIZE = 640;
const CORNER_SAMPLE_SIZE = 8;
const BACKGROUND_DISTANCE = 54;
const VISIBLE_ALPHA = 18;
const OPAQUE_SAMPLE_ALPHA = 180;
const INSET_SAMPLE_ALPHA = 18;

const colorDistance = (data, offset, bg) => {
  const dr = data[offset] - bg.r;
  const dg = data[offset + 1] - bg.g;
  const db = data[offset + 2] - bg.b;
  return Math.sqrt((dr * dr) + (dg * dg) + (db * db));
};

const fullBounds = (width, height) => ({ minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 });

const findVisibleBounds = (data, width, height, minAlpha = VISIBLE_ALPHA) => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let transparent = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(((y * width) + x) * 4) + 3];
      if (alpha < 236) transparent += 1;
      if (alpha <= minAlpha) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX >= minX && maxY >= minY
    ? { minX, minY, maxX, maxY, transparent: transparent / (width * height) > 0.018 }
    : null;
};

const sampleCornerBackground = (
  data,
  width,
  height,
  bounds = fullBounds(width, height),
  minAlpha = OPAQUE_SAMPLE_ALPHA,
) => {
  if (!bounds) return null;
  const sampleWidth = Math.min(CORNER_SAMPLE_SIZE, bounds.maxX - bounds.minX + 1);
  const sampleHeight = Math.min(CORNER_SAMPLE_SIZE, bounds.maxY - bounds.minY + 1);
  const corners = [
    [bounds.minX, bounds.minY],
    [bounds.maxX - sampleWidth + 1, bounds.minY],
    [bounds.minX, bounds.maxY - sampleHeight + 1],
    [bounds.maxX - sampleWidth + 1, bounds.maxY - sampleHeight + 1],
  ];
  let count = 0;
  let sampledCorners = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  let base = null;
  let spread = 0;

  corners.forEach(([startX, startY]) => {
    let sampled = false;
    for (let y = startY; y < startY + sampleHeight; y += 1) {
      for (let x = startX; x < startX + sampleWidth; x += 1) {
        const offset = ((y * width) + x) * 4;
        if (data[offset + 3] <= minAlpha) continue;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        if (!base) base = [r, g, b];
        spread = Math.max(spread, Math.abs(r - base[0]) + Math.abs(g - base[1]) + Math.abs(b - base[2]));
        red += r;
        green += g;
        blue += b;
        count += 1;
        sampled = true;
      }
    }
    if (sampled) sampledCorners += 1;
  });

  return count && spread <= 75
    ? { r: red / count, g: green / count, b: blue / count, sampledCorners }
    : null;
};

const floodEdgeBackground = (imageData, width, height, bg, bounds = fullBounds(width, height)) => {
  if (!bg || !bounds) return;
  const { data } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const enqueue = (index) => {
    if (index < 0 || index >= visited.length || visited[index]) return;
    const offset = index * 4;
    if (data[offset + 3] <= 0 || colorDistance(data, offset, bg) > BACKGROUND_DISTANCE) return;
    visited[index] = 1;
    queue[tail++] = index;
  };

  for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
    enqueue((bounds.minY * width) + x);
    enqueue((bounds.maxY * width) + x);
  }
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    enqueue((y * width) + bounds.minX);
    enqueue((y * width) + bounds.maxX);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > bounds.minX) enqueue(index - 1);
    if (x < bounds.maxX) enqueue(index + 1);
    if (y > bounds.minY) enqueue(index - width);
    if (y < bounds.maxY) enqueue(index + width);
  }
  for (let index = 0; index < visited.length; index += 1) if (visited[index]) data[(index * 4) + 3] = 0;
};

const trimTransparentEdges = (canvas, imageData) => {
  const { width, height } = canvas;
  const bounds = findVisibleBounds(imageData.data, width, height, 10);
  if (!bounds) return null;
  const cropWidth = bounds.maxX - bounds.minX + 1;
  const cropHeight = bounds.maxY - bounds.minY + 1;
  const padding = Math.max(5, Math.round(Math.max(cropWidth, cropHeight) * 0.035));
  const output = document.createElement("canvas");
  output.width = cropWidth + (padding * 2);
  output.height = cropHeight + (padding * 2);
  output.getContext("2d")?.drawImage(canvas, bounds.minX, bounds.minY, cropWidth, cropHeight, padding, padding, cropWidth, cropHeight);
  return output;
};

export const cleanTeamLogoSource = (src) => {
  if (!src || typeof document === "undefined" || typeof Image === "undefined") return Promise.resolve(src);
  if (logoCache.has(src)) return Promise.resolve(logoCache.get(src));
  return new Promise((resolve) => {
    const finish = (result) => {
      const safeResult = result || src;
      logoCache.set(src, safeResult);
      resolve(safeResult);
    };
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const scale = Math.min(1, MAX_LOGO_SIZE / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return finish(src);
        context.drawImage(image, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);
        const visibleBounds = findVisibleBounds(imageData.data, width, height);
        const alreadyTransparent = visibleBounds?.transparent === true;
        let floodBounds = fullBounds(width, height);
        let background;

        if (alreadyTransparent && visibleBounds) {
          const candidate = sampleCornerBackground(imageData.data, width, height, visibleBounds, INSET_SAMPLE_ALPHA);
          if (candidate?.sampledCorners >= 3) {
            background = candidate;
            floodBounds = visibleBounds;
          }
        } else {
          background = sampleCornerBackground(imageData.data, width, height);
        }
        if (background) floodEdgeBackground(imageData, width, height, background, floodBounds);
        context.putImageData(imageData, 0, 0);
        const trimmed = trimTransparentEdges(canvas, imageData);
        finish(trimmed ? trimmed.toDataURL("image/png") : src);
      } catch {
        finish(src);
      }
    };
    image.onerror = () => finish(src);
    image.src = src;
  });
};

export const __testUtils = { findVisibleBounds, sampleCornerBackground, floodEdgeBackground, INSET_SAMPLE_ALPHA };

export default function useCleanTeamLogo(src) {
  const [cleaned, setCleaned] = useState(src);
  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setCleaned(src);
      return undefined;
    }
    setCleaned(logoCache.get(src) || src);
    cleanTeamLogoSource(src).then((result) => { if (!cancelled) setCleaned(result); });
    return () => { cancelled = true; };
  }, [src]);
  return cleaned || src;
}
