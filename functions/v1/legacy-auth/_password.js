const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 120000;
const PBKDF2_BITS = 256;
const FALLBACK_ITERATIONS = 10000;

const toHex = bytes => Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

function parseSaltHex(saltHex) {
  const normalized = String(saltHex || "").trim().toLowerCase();
  if (!/^[0-9a-f]{32}$/i.test(normalized)) throw new Error("invalid_salt_hex");
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) out[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  return out;
}

async function pbkdf2Hash(password, saltHex) {
  const salt = parseSaltHex(saltHex);
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, key, PBKDF2_BITS);
  return `pbkdf2:${toHex(new Uint8Array(bits))}`;
}

async function iterativeFallbackHash(password, saltHex) {
  let bytes = encoder.encode(`${saltHex}:${password}`);
  for (let i = 0; i < FALLBACK_ITERATIONS; i += 1) {
    const digested = await crypto.subtle.digest("SHA-256", bytes);
    bytes = new Uint8Array(digested);
  }
  return `sha256-fallback:${toHex(bytes)}`;
}

export async function hashLegacyPassword(password, saltHex) {
  const pwd = String(password || "");
  try {
    return await pbkdf2Hash(pwd, saltHex);
  } catch {
    return iterativeFallbackHash(pwd, saltHex);
  }
}

export async function verifyLegacyPassword(password, saltHex, expectedHash) {
  const stored = String(expectedHash || "");
  if (!stored) return false;
  if (stored.startsWith("pbkdf2:")) return (await pbkdf2Hash(password, saltHex)) === stored;
  if (stored.startsWith("sha256-fallback:")) return (await iterativeFallbackHash(password, saltHex)) === stored;
  return (await pbkdf2Hash(password, saltHex).catch(() => iterativeFallbackHash(password, saltHex))) === `pbkdf2:${stored}`
    || (await iterativeFallbackHash(password, saltHex)) === `sha256-fallback:${stored}`;
}
