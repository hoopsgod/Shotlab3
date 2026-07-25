import { useEffect, useState } from "react";

const logoCache = new Map();
const MAX_LOGO_SIZE = 512;
const CORNER_SAMPLE_SIZE = 6;
const BACKGROUND_DISTANCE = 56;
const FEATHER_DISTANCE = 78;

const colorDistance = (data, offset, bg) => {
  const dr = data[offset] - bg.r;
  const dg = data[offset + 1] - bg.g;
  const db = data[offset + 2] - bg.b;
  return Math.sqrt((dr * dr) + (dg * dg) + (db * db));
};

const sampleCornerBackground = (data, width, height) => {
  const samples = [];
  const corners = [
    [0, 0],
    [Math.max(0, width - CORNER_SAMPLE_SIZE), 0],
    [0, Math.max(0, height - CORNER_SAMPLE_SIZE)],
    [Math.max(0, width - CORNER_SAMPLE_SIZE), Math.max(0, height - CORNER_SAMPLE_SIZE)],
  ];

  corners.forEach(([startX, startY]) => {
    for (let y = startY; y < Math.min(height, startY + CORNER_SAMPLE_SIZE); y += 1) {
      for (let x = startX; x < Math.min(width, startX + CORNER_SAMPLE_SIZE); x += 1) {
        const offset = ((y * width) + x) * 4;
        if (data[offset + 3] > 48) samples.push([data[offset], data[offset + 1], data[offset + 2]]);
      }
    }
  });

  if (!samples.length) return null;
  const totals = samples.reduce((sum, sample) => [sum[0] + sample[0], sum[1] + sample[1], sum[2] + sample[2]], [0, 0, 0]);
  return { r: totals[0] / samples.length, g: totals[1] / samples.length, b: totals[2] / samples.length };
};

const removeConnectedEdgeBackground = (imageData, width, height, bg) => {
  if (!bg) return;
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

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue(((height - 1) * width) + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue((y * width) + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y < height - 1) enqueue(index + width);
  }

  for (let index = 0; index < visited.length; index += 1) {
    if (!visited[index]) continue;
    data[(index * 4) + 3] = 0;
  }

  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    const touchesRemoved = (x > 0 && visited[index - 1]) || (x < width - 1 && visited[index + 1]) || (y > 0 && visited[index - width]) || (y < height - 1 && visited[index + width]);
    if (!touchesRemoved) continue;
    const offset = index * 4;
    if (colorDistance(data, offset, bg) <= FEATHER_DISTANCE) data[offset + 3] = Math.min(data[offset + 3], 96);
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
  const padding = Math.max(4, Math.round(Math.max(cropWidth, cropHeight) * 0.035));
  const output = document.createElement("canvas");
  output.width = cropWidth + (padding * 2);
  output.height = cropHeight + (padding * 2);
  const outputContext = output.getContext("2d");
  outputContext?.drawImage(canvas, minX, minY, cropWidth, cropHeight, padding, padding, cropWidth, cropHeight);
  return output;
};

const cleanLogo = (src) => new Promise((resolve) => {
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
      if (!context) return resolve(src);
      context.drawImage(image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const background = sampleCornerBackground(imageData.data, width, height);
      removeConnectedEdgeBackground(imageData, width, height, background);
      context.putImageData(imageData, 0, 0);
      const trimmed = trimTransparentEdges(canvas, imageData);
      resolve(trimmed ? trimmed.toDataURL("image/png") : src);
    } catch {
      resolve(src);
    }
  };
  image.onerror = () => resolve(src);
  image.src = src;
});

export default function useCleanTeamLogo(src) {
  const [cleaned, setCleaned] = useState(src);

  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setCleaned(src);
      return undefined;
    }
    setCleaned(src);
    if (logoCache.has(src)) {
      setCleaned(logoCache.get(src));
      return undefined;
    }

    cleanLogo(src).then((result) => {
      logoCache.set(src, result);
      if (!cancelled) setCleaned(result);
    });

    return () => { cancelled = true; };
  }, [src]);

  return cleaned || src;
}
