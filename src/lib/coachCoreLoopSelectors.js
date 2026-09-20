const list = (value) => Array.isArray(value) ? value : [];
const text = (value) => String(value ?? "").trim();
const key = (value) => text(value).toLowerCase();
const states = new Set(["loading", "success", "error", "permission", "unavailable"]);
const rowKey = (row = {}) => key(row.key || row.email || row.player?.email || row.player?.playerId || row.player?.player_id || row.player?.id || row.name);
const recordKey = (row = {}) => key(row.playerIdentity || row.player_identity || row.player?.email || row.playerName);
const recordState = (row) => ["planned", "completed", "dismissed"].includes(key(row?.state)) ? key(row.state) : "";

export function buildCoachCoreLoopModel({ playerRows = [], records = [], requestState = "loading", error = "", storageMode = "", feedback = null } = {}) {
  const request = states.has(requestState) ? requestState : "loading";
  const latest = new Map();
  for (const raw of list(records)) {
    if (!raw || typeof raw !== "object") continue;
    const identity = recordKey(raw);
    if (!identity || !recordState(raw)) continue;
    latest.set(identity, { playerIdentity: identity, state: recordState(raw) });
  }
  const rows = list(playerRows).filter((row) => row && typeof row === "object" && rowKey(row)).map((row) => {
    const identity = rowKey(row);
    const record = latest.get(identity) || null;
    const state = recordState(record);
    return {
      id: identity,
      player: row.player || row,
      name: text(row.name || row.player?.name || row.player?.displayName || row.email) || "Player",
      statusKey: text(row.statusKey) || "unknown",
      lastActivityDate: text(row.lastActivityDate),
      recordState: state,
      open: state === "planned" || state !== "completed" && row.statusKey !== "active",
    };
  });
  const attentionItems = rows.filter((row) => row.open).map((row) => {
    const planned = row.recordState === "planned";
    return {
      id: row.id,
      player: row.player,
      name: row.name,
      detail: planned ? "Follow-up open. Confirm the next step." : row.statusKey === "new" ? "No training activity yet. Check in to find the blocker." : "No activity logged this week. Confirm whether a follow-up is needed.",
      meta: planned ? "Follow-up planned · activity may be unchanged" : row.lastActivityDate ? `Last activity ${row.lastActivityDate}` : "New roster member · no activity yet",
      tone: row.statusKey === "attention" || planned ? "danger" : "warning",
    };
  });
  const feedbackId = recordKey(feedback || {});
  const feedbackRow = feedbackId ? rows.find((row) => row.id === feedbackId) || { id: feedbackId, name: text(feedback?.playerName) || "Player", recordState: recordState(feedback) } : null;
  const state = request === "success" ? attentionItems.length ? "populated" : "empty" : request;
  return { requestState: request, state, error: text(error), storageMode: text(storageMode) || "unknown", hasRoster: rows.length > 0, openCount: attentionItems.length, attentionItems, feedback: feedbackRow ? { ...feedbackRow, state: recordState(feedback) || feedbackRow.recordState || "planned" } : null };
}

export function getCoachCoreLoopStateLabel(model = {}) {
  if (["loading", "permission", "unavailable", "error"].includes(model.requestState)) return model.requestState;
  return model.state === "empty" ? (model.hasRoster ? "all_clear" : "no_roster") : "populated";
}
