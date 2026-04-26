export const CONSUME_GUARD_STALE_MS = 15_000;

export function buildConsumeInFlightKey({ email = "", inviteCode = "", joinContextToken = "", teamId = "" } = {}) {
  return [
    String(email || "").trim().toLowerCase(),
    String(inviteCode || "").trim().toUpperCase(),
    String(joinContextToken || "").trim(),
    String(teamId || "").trim(),
  ].join("::");
}

export function clearConsumeGuard(state, now = Date.now(), reason = "manual_clear") {
  if (!state || typeof state !== "object") return;
  state.active = false;
  state.key = "";
  state.startedAt = 0;
  state.lastClearedAt = Number(now) || Date.now();
  state.lastClearedReason = String(reason || "manual_clear");
}

export function evaluateConsumeGuard(state, key, now = Date.now(), staleMs = CONSUME_GUARD_STALE_MS) {
  const currentState = state || {};
  const currentKey = String(currentState.key || "");
  const active = Boolean(currentState.active);
  const startedAt = Number(currentState.startedAt || 0);
  const ageMs = startedAt > 0 ? Math.max(0, Number(now) - startedAt) : 0;
  let staleCleared = false;

  if (active && startedAt > 0 && ageMs > staleMs) {
    clearConsumeGuard(currentState, now, "stale_timeout");
    staleCleared = true;
  }

  const stillActive = Boolean(currentState.active);
  const blocked = stillActive && currentKey === String(key || "");
  return {
    blocked,
    staleCleared,
    ageMs: blocked ? ageMs : 0,
    reason: blocked ? "active_request" : "",
  };
}

export function markConsumeGuardStarted(state, key, now = Date.now()) {
  if (!state || typeof state !== "object") return;
  state.active = true;
  state.key = String(key || "");
  state.startedAt = Number(now) || Date.now();
}

export function getConsumeInFlightAgeMs(state, now = Date.now()) {
  const startedAt = Number(state?.startedAt || 0);
  if (!startedAt) return 0;
  return Math.max(0, Number(now) - startedAt);
}

export function acquireConsumeSingleFlight(state, { key, now = Date.now(), staleMs = CONSUME_GUARD_STALE_MS, start }) {
  if (!state || typeof state !== "object") throw new Error("consume_guard_state_required");
  if (typeof start !== "function") throw new Error("consume_guard_start_required");
  const active = Boolean(state.active);
  const sameKey = String(state.key || "") === String(key || "");
  const ageMs = getConsumeInFlightAgeMs(state, now);

  if (active && ageMs > staleMs) {
    try {
      state.abortController?.abort?.();
    } catch {}
    clearConsumeGuard(state, now, "stale_timeout");
  } else if (active && sameKey && state.promise) {
    return { mode: "joined", promise: state.promise, ageMs };
  } else if (active && !sameKey) {
    clearConsumeGuard(state, now, "replaced_key");
  }

  const started = start();
  state.active = true;
  state.key = String(key || "");
  state.startedAt = Number(now) || Date.now();
  state.promise = started?.promise || null;
  state.abortController = started?.abortController || null;
  return { mode: "started", promise: state.promise, ageMs: 0 };
}
