export function normalizeInviteCode(rawCode = "") {
  return String(rawCode).trim().replace(/[\s-]+/g, "").toUpperCase();
}

export function logEvent(event, payload = {}) {
  console.log(
    JSON.stringify({
      event,
      ts: new Date().toISOString(),
      ...payload,
    }),
  );
}
