const RATE_BUCKETS = globalThis.__shotlabRateLimitBuckets || new Map();
if (!globalThis.__shotlabRateLimitBuckets) {
  globalThis.__shotlabRateLimitBuckets = RATE_BUCKETS;
}

function prune(now) {
  for (const [key, bucket] of RATE_BUCKETS.entries()) {
    if (bucket.resetAt <= now) RATE_BUCKETS.delete(key);
  }
}

export function enforceRateLimit({ key, max = 10, windowMs = 60_000 }) {
  const now = Date.now();
  prune(now);
  const bucketKey = `${key}:${Math.floor(now / windowMs)}`;
  const current = RATE_BUCKETS.get(bucketKey) || { count: 0, resetAt: now + windowMs };
  current.count += 1;
  RATE_BUCKETS.set(bucketKey, current);

  return {
    allowed: current.count <= max,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function getClientKey(request, subjectKey = "") {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const subject = String(subjectKey || "").trim().toLowerCase();
  return `${ip}:${subject || "anon"}`;
}

export function requireApiToken(request, env) {
  const configuredToken = env?.INTERNAL_API_TOKEN;
  if (!configuredToken) {
    return { ok: true };
  }

  const candidate = request.headers.get("x-internal-api-token") || "";
  if (candidate && candidate === configuredToken) {
    return { ok: true };
  }

  return { ok: false, status: 401, error: "unauthorized" };
}

export function publicValidationError() {
  return { status: 400, error: "invalid_or_unavailable_code" };
}
