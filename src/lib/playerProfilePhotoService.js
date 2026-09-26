import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { isDemoAccount } from "./demoMode.js";

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const OUTPUT_SIZE = 512;
const JPEG_QUALITY = 0.82;
const MAX_FALLBACK_DATA_URL_CHARS = 2_000_000;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read this photo."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode this photo."));
    image.src = src;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function normalizeForUpload(file) {
  if (typeof document === "undefined" || typeof Image === "undefined" || typeof FileReader === "undefined") {
    return { uploadFile: file, fallbackDataUrl: "" };
  }

  const source = await fileToDataUrl(file);
  const image = await loadImage(source);
  const width = Math.max(1, image.naturalWidth || image.width || 1);
  const height = Math.max(1, image.naturalHeight || image.height || 1);
  const side = Math.max(1, Math.min(width, height));
  const sx = Math.max(0, Math.round((width - side) / 2));
  const sy = Math.max(0, Math.round((height - side) / 2));
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare this photo.");
  context.drawImage(image, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const fallbackDataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
  const uploadFile = blob && blob.size > 0
    ? new File([blob], "avatar.jpg", { type: "image/jpeg" })
    : file;
  return {
    uploadFile,
    fallbackDataUrl: fallbackDataUrl.length <= MAX_FALLBACK_DATA_URL_CHARS ? fallbackDataUrl : "",
  };
}

export async function savePlayerProfilePhoto(id, file) {
  if (!file || !String(file.type || "").toLowerCase().startsWith("image/")) {
    throw new Error("Choose an image from Photos or Files.");
  }
  if (Number(file.size || 0) <= 0 || Number(file.size || 0) > MAX_INPUT_BYTES) {
    throw new Error("Choose a photo smaller than 15 MB.");
  }
  if (isDemoAccount(id)) return URL.createObjectURL(file);

  let prepared = { uploadFile: file, fallbackDataUrl: "" };
  try {
    prepared = await normalizeForUpload(file);
  } catch {
    try {
      const rawDataUrl = await fileToDataUrl(file);
      prepared.fallbackDataUrl = rawDataUrl.length <= MAX_FALLBACK_DATA_URL_CHARS ? rawDataUrl : "";
    } catch {}
  }

  const body = new FormData();
  body.append("file", prepared.uploadFile);
  body.append("player_email", id);
  if (prepared.fallbackDataUrl) body.append("fallback_data_url", prepared.fallbackDataUrl);

  const response = await fetch("/v1/player-photo", {
    method: "POST",
    headers: buildApiIdentityHeaders(),
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.photo_url) {
    throw new Error(String(data?.message || "Upload failed. Try another photo."));
  }
  return data.photo_url;
}

export const __testUtils = { normalizeForUpload, MAX_INPUT_BYTES, OUTPUT_SIZE, JPEG_QUALITY };
