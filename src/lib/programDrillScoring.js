import { normalizePlayerDataEmail, isPlayerHiddenFromActiveLeaderboards } from "./playerDataManagement.js";

const clean = (value) => String(value ?? "").trim();
export const scoreToNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const drillAllowsZeroScore = (drill = {}) => drill?.allowZeroScore === true || drill?.minScore === 0;

export const validateProgramDrillScore = (value, drill = {}) => {
  const score = scoreToNumber(value);
  if (score === null) return { ok: false, error: "Score is required." };
  if (score < 0) return { ok: false, error: "Score cannot be negative." };
  if (score === 0 && !drillAllowsZeroScore(drill)) return { ok: false, error: "Score must be greater than 0." };
  const max = Number(drill?.max);
  if (Number.isFinite(max) && score > max) return { ok: false, error: `Score cannot exceed ${max}.` };
  return { ok: true, score };
};

export const resolveRosterPlayerKey = ({ user = {}, players = [] } = {}) => {
  const email = normalizePlayerDataEmail(user?.email);
  const teamId = clean(user?.teamId || user?.team_id);
  const match = (Array.isArray(players) ? players : []).find((player) => {
    if (normalizePlayerDataEmail(player?.email) !== email) return false;
    const playerTeamId = clean(player?.teamId || player?.team_id);
    return !teamId || !playerTeamId || playerTeamId === teamId;
  });
  return clean(match?.player_id || match?.playerId || match?.id || match?.user_id || match?.userId || user?.player_id || user?.playerId || email);
};

export const buildProgramScoreRow = ({ drill = {}, score, user = {}, players = [], now = Date.now(), date } = {}) => {
  const drillId = clean(drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name);
  const email = normalizePlayerDataEmail(user?.email);
  const teamId = clean(user?.teamId || user?.team_id);
  const playerId = resolveRosterPlayerKey({ user, players });
  if (!drillId || !email || !teamId || !playerId) return null;
  return {
    id: `score_${now}`,
    email,
    playerId,
    player_id: playerId,
    teamId,
    team_id: teamId,
    name: clean(user?.name),
    drillId,
    drill_id: drillId,
    drillName: clean(drill?.name),
    score: Number(score),
    date,
    ts: now,
    src: "program",
  };
};

const rowDrillKey = (row = {}) => clean(row?.drillId || row?.drill_id || row?.drillKey || row?.drill_key);
const rowPlayerKey = (row = {}) => normalizePlayerDataEmail(row?.player_id || row?.playerId || row?.email);

export const isProgramDrillScoreForDrill = (score = {}, drill = {}) => {
  const key = clean(drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name);
  return score?.src === "program" && key && rowDrillKey(score) === key;
};

export const buildProgramDrillLeaderboardRows = ({ scores = [], drill = {}, players = [], limit } = {}) => {
  const activePlayers = (Array.isArray(players) ? players : []).filter((p) => p?.role !== "coach" && !isPlayerHiddenFromActiveLeaderboards(p));
  const activeKeys = new Set(activePlayers.flatMap((p) => [p?.email, p?.player_id, p?.playerId, p?.id, p?.user_id, p?.userId].map(normalizePlayerDataEmail).filter(Boolean)));
  const byPlayer = new Map();
  (Array.isArray(scores) ? scores : []).filter((score) => isProgramDrillScoreForDrill(score, drill)).forEach((score) => {
    const key = rowPlayerKey(score);
    if (!key || !activeKeys.has(key)) return;
    const player = activePlayers.find((p) => [p?.email, p?.player_id, p?.playerId, p?.id, p?.user_id, p?.userId].map(normalizePlayerDataEmail).includes(key));
    const existing = byPlayer.get(key) || { player_id: key, email: normalizePlayerDataEmail(score?.email || player?.email), name: score?.name || player?.name || key, total: 0 };
    existing.total += Number(score?.score || 0);
    byPlayer.set(key, existing);
  });
  const rows = [...byPlayer.values()].sort((a, b) => b.total - a.total || String(a.name).localeCompare(String(b.name))).map((row, index) => ({ ...row, rank: index + 1 }));
  return Number.isFinite(limit) ? rows.slice(0, limit) : rows;
};
