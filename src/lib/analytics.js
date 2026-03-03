const QUEUE_KEY = "sl:analytics-queue";
const SESSION_KEY = "sl:analytics-session-id";
const DEVICE_KEY = "sl:analytics-device-id";
const MAX_QUEUE = 200;

const ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT || "";
const API_KEY = import.meta.env.VITE_ANALYTICS_API_KEY || "";

let initialized = false;
let warnedMissingEndpoint = false;

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getQueue() {
  return safeParse(localStorage.getItem(QUEUE_KEY), []);
}

function setQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
}

function getOrSet(storage, key, prefix) {
  let v = storage.getItem(key);
  if (!v) {
    v = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    storage.setItem(key, v);
  }
  return v;
}

function headers() {
  return {
    "Content-Type": "application/json",
    ...(API_KEY ? { "x-api-key": API_KEY } : {}),
  };
}

async function postEvents(events, preferBeacon = false) {
  if (!ENDPOINT || events.length === 0) return false;

  const body = JSON.stringify({ events });
  if (preferBeacon && navigator.sendBeacon) {
    try {
      const blob = new Blob([body], { type: "application/json" });
      return navigator.sendBeacon(ENDPOINT, blob);
    } catch {
      return false;
    }
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: headers(),
      body,
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function flushAnalyticsQueue(preferBeacon = false) {
  const queue = getQueue();
  if (!queue.length) return;
  const ok = await postEvents(queue, preferBeacon);
  if (ok) setQueue([]);
}

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  if (!ENDPOINT && !warnedMissingEndpoint) {
    warnedMissingEndpoint = true;
    console.warn("[analytics] VITE_ANALYTICS_ENDPOINT not set; events will be queued locally.");
  }

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAnalyticsQueue(true);
  });
  window.addEventListener("beforeunload", () => flushAnalyticsQueue(true));

  flushAnalyticsQueue();
}

export async function trackBackendEvent(type, payload = {}) {
  if (typeof window === "undefined") return;

  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    ts: Date.now(),
    sessionId: getOrSet(sessionStorage, SESSION_KEY, "sess"),
    deviceId: getOrSet(localStorage, DEVICE_KEY, "dev"),
    ...payload,
  };

  const queue = [...getQueue(), event].slice(-MAX_QUEUE);
  setQueue(queue);

  // Fire-and-forget optimistic flush.
  flushAnalyticsQueue();
}
