import { useEffect, useState } from "react";

const logoCache = new Map();
const MAX_LOGO_SIZE = 640;
const CORNER_SAMPLE_SIZE = 8;
const BACKGROUND_DISTANCE = 54;
const FEATHER_DISTANCE = 78;
const VISIBLE_ALPHA = 18;
const OPAQUE_SAMPLE_ALPHA = 180;
const INSET_SAMPLE_ALPHA = 18;
const INSET_BACKGROUND_PERIMETER_RATIO = 0.52;

const colorDistance = (data, offset, bg) => {
  const dr = data[offset] - bg.r;
  const dg = data[offset + 1] - bg.g;
  const db = data[offset + 2] - bg.b;
  return Math.sqrt((dr * dr) + (dg * dg) + (db * db));
};

const fullBounds = (width, height) => ({ minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 });

const findVisibleBounds = (data, width, height) => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(((y * width) + x) * 4) + 3] <= VISIBLE_ALPHA) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return maxX >= minX && maxY >= minY ? { minX, minY, maxX, maxY } : null;
};

const sampleCornerBackground = (
  data,
  width,
  height,
  bounds = fullBounds(width, height),
  minAlpha = OPAQUE_SAMPLE_ALPHA,
) => {
  if (!bounds) return null;
  const samples = [];
  const boundWidth = Math.max(1, bounds.maxX - bounds.minX + 1);
  const boundHeight = Math.max(1, bounds.maxY - bounds.minY + 1);
  const sampleWidth = Math.min(CORNER_SAMPLE_SIZE, boundWidth);
  const sampleHeight = Math.min(CORNER_SAMPLE_SIZE, boundHeight);
  const corners = [
    [bounds.minX, bounds.minY],
    [Math.max(bounds.minX, bounds.maxX - sampleWidth + 1), bounds.minY],
    [bounds.minX, Math.max(bounds.minY, bounds.maxY - sampleHeight + 1)],
    [Math.max(bounds.minX, bounds.maxX - sampleWidth + 1), Math.max(bounds.minY, bounds.maxY - sampleHeight + 1)],
  ];

  corners.forEach(([startX, startY]) => {
    for (let y = startY; y <= Math.min(bounds.maxY, startY + sampleHeight - 1); y += 1) {
      for (let x = startX; x <= Math.min(bounds.maxX, startX + sampleWidth - 1); x += 1) {
        const offset = ((y * width) + x) * 4;
        if (data[offset + 3] > minAlpha) samples.push([data[offset], data[offset + 1], data[offset + 2]]);
      }
    }
  });

  if (!samples.length) return null;
  const totals = samples.reduce((sum, sample) => [sum[0] + sample[0], sum[1] + sample[1], sum[2] + sample[2]], [0, 0, 0]);
  const bg = { r: totals[0] / samples.length, g: totals[1] / samples.length, b: totals[2] / samples.length };
  const averageSpread = samples.reduce((sum, sample) => {
    const dr = sample[0] - bg.r;
    const dg = sample[1] - bg.g;
    const db = sample[2] - bg.b;
    return sum + Math.sqrt((dr * dr) + (dg * dg) + (db * db));
  }, 0) / samples.length;
  return averageSpread <= 34 ? bg : null;
};

const perimeterBackgroundRatio = (
  data,
  width,
  bounds,
  bg,
  minAlpha = OPAQUE_SAMPLE_ALPHA,
) => {
  if (!bounds || !bg) return 0;
  let matching = 0;
  let total = 0;
  const inspect = (x, y) => {
    total += 1;
    const offset = ((y * width) + x) * 4;
    if (data[offset + 3] > minAlpha && colorDistance(data, offset, bg) <= BACKGROUND_DISTANCE) matching += 1;
  };

  for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
    inspect(x, bounds.minY);
    if (bounds.maxY !== bounds.minY) inspect(x, bounds.maxY);
  }
  for (let y = bounds.minY + 1; y < bounds.maxY; y += 1) {
    inspect(bounds.minX, y);
    if (bounds.maxX !== bounds.minX) inspect(bounds.maxX, y);
  }

  return matching / Math.max(1, total);
};

const hasMeaningfulTransparency = (data) => {
  let transparent = 0;
  const pixels = data.length / 4;
  for (let offset = 3; offset < data.length; offset += 4) {
    if (data[offset] < 236) transparent += 1;
  }
  return transparent / Math.max(1, pixels) > 0.018;
};

const floodEdgeBackground = (imageData, width, height, bg, bounds = fullBounds(width, height)) => {
  if (!bg || !bounds) return new Uint8Array(width * height);
  const { data } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const canRemove = (index) => {
    const offset = index * 4;
    return data[offset + 3] > 0 && colorDistance(data, offset, bg) <= BACKGROUND_DISTANCE;
  };
  const enqueue = (index) => {
    if (index < 0 || index >= visited.length || visited[index] || !canRemove(index)) return;
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
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
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > bounds.minX) enqueue(index - 1);
    if (x < bounds.maxX) enqueue(index + 1);
    if (y > bounds.minY) enqueue(index - width);
    if (y < bounds.maxY) enqueue(index + width);
  }

  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) data[(index * 4) + 3] = 0;
  }
  return visited;
};

const removeLikelyRectangularFrame = (imageData, width, height) => {
  const { data } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const edgeTolerance = Math.max(2, Math.round(Math.min(width, height) * 0.018));

  for (let seed = 0; seed < visited.length; seed += 1) {
    if (visited[seed] || data[(seed * 4) + 3] <= VISIBLE_ALPHA) continue;
    let head = 0;
    let tail = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    const members = [];
    visited[seed] = 1;
    queue[tail++] = seed;

    while (head < tail) {
      const index = queue[head++];
      members.push(index);
      const x = index % width;
      const y = Math.floor(index / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      const neighbors = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, y > 0 ? index - width : -1, y < height - 1 ? index + width : -1];
      neighbors.forEach((next) => {
        if (next < 0 || visited[next] || data[(next * 4) + 3] <= VISIBLE_ALPHA) return;
        visited[next] = 1;
        queue[tail++] = next;
      });
    }

    const touches = Number(minX <= edgeTolerance) + Number(minY <= edgeTolerance) + Number(maxX >= width - 1 - edgeTolerance) + Number(maxY >= height - 1 - edgeTolerance);
    const boxArea = Math.max(1, (maxX - minX + 1) * (maxY - minY + 1));
    const density = members.length / boxArea;
    const looksLikeFrame = touches >= 3 && density < 0.2 && members.length < (width * height * 0.28);
    if (looksLikeFrame) members.forEach((index) => { data[(index * 4) + 3] = 0; });
  }
};

const featherTransparentBoundary = (imageData, width, height, bg) => {
  if (!bg) return;
  const { data } = imageData;
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    if (data[offset + 3] <= 0) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    const touchesTransparent = (x > 0 && data[((index - 1) * 4) + 3] === 0)
      || (x < width - 1 && data[((index + 1) * 4) + 3] === 0)
      || (y > 0 && data[((index - width) * 4) + 3] === 0)
      || (y < height - 1 && data[((index + width) * 4) + 3] === 0);
    if (!touchesTransparent) continue;
    const distance = colorDistance(data, offset, bg);
    if (distance <= FEATHER_DISTANCE) data[offset + 3] = Math.min(data[offset + 3], Math.round(70 + ((distance / FEATHER_DISTANCE) * 135)));
  }
};

const trimTransparentEdges = (canvas, imageData) => {
  const { width, height } = canvas;
  const { data } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(((y * width) + x) * 4) + 3] <= 10) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return null;
  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const padding = Math.max(5, Math.round(Math.max(cropWidth, cropHeight) * 0.035));
  const output = document.createElement("canvas");
  output.width = cropWidth + (padding * 2);
  output.height = cropHeight + (padding * 2);
  const outputContext = output.getContext("2d");
  outputContext?.drawImage(canvas, minX, minY, cropWidth, cropHeight, padding, padding, cropWidth, cropHeight);
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
    image.decoding = "async";
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
        const alreadyTransparent = hasMeaningfulTransparency(imageData.data);
        const visibleBounds = findVisibleBounds(imageData.data, width, height);
        let background = null;
        let floodBounds = fullBounds(width, height);

        if (alreadyTransparent && visibleBounds) {
          const insetCandidate = sampleCornerBackground(
            imageData.data,
            width,
            height,
            visibleBounds,
            INSET_SAMPLE_ALPHA,
          );
          if (
            insetCandidate
            && perimeterBackgroundRatio(
              imageData.data,
              width,
              visibleBounds,
              insetCandidate,
              INSET_SAMPLE_ALPHA,
            ) >= INSET_BACKGROUND_PERIMETER_RATIO
          ) {
            background = insetCandidate;
            floodBounds = visibleBounds;
          }
        } else {
          background = sampleCornerBackground(imageData.data, width, height);
        }

        if (background) {
          floodEdgeBackground(imageData, width, height, background, floodBounds);
          removeLikelyRectangularFrame(imageData, width, height);
          const remainingBounds = findVisibleBounds(imageData.data, width, height);
          if (remainingBounds && !alreadyTransparent) floodEdgeBackground(imageData, width, height, background, fullBounds(width, height));
          featherTransparentBoundary(imageData, width, height, background);
        }

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

export const __testUtils = {
  findVisibleBounds,
  sampleCornerBackground,
  perimeterBackgroundRatio,
  floodEdgeBackground,
  hasMeaningfulTransparency,
  INSET_SAMPLE_ALPHA,
  INSET_BACKGROUND_PERIMETER_RATIO,
};

export default function useCleanTeamLogo(src) {
  const [cleaned, setCleaned] = useState(src);

  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setCleaned(src);
      return undefined;
    }
    setCleaned(logoCache.get(src) || src);
    cleanTeamLogoSource(src).then((result) => {
      if (!cancelled) setCleaned(result);
    });
    return () => { cancelled = true; };
  }, [src]);

  return cleaned || src;
}
