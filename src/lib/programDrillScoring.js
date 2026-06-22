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

export const buildProgramScoreRow = ({ id, drill = {}, score, user = {}, players = [], now = Date.now(), date } = {}) => {
  const drillId = clean(drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name);
  const email = normalizePlayerDataEmail(user?.email);
  const teamId = clean(user?.teamId || user?.team_id);
  const playerId = resolveRosterPlayerKey({ user, players });
  if (!drillId || !email || !teamId || !playerId) return null;
  return {
    id: clean(id) || `score_${now}`,
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
const rowPlayerKey = (row = {}) => normalizePlayerDataEmail(row?.playerId || row?.player_id || row?.email || row?.player_email);
const rowEmail = (row = {}) => normalizePlayerDataEmail(row?.email || row?.player_email);
const rowTeamId = (row = {}) => clean(row?.teamId || row?.team_id);

export const normalizeProgramScoreRow = (row = {}) => {
  const score = Number(row?.score);
  const drillId = rowDrillKey(row);
  const email = rowEmail(row);
  const playerId = rowPlayerKey(row);
  const teamId = rowTeamId(row);
  if (!drillId || !Number.isFinite(score)) return null;
  return {
    ...row,
    id: clean(row?.id),
    email,
    playerEmail: email,
    player_email: email,
    playerId,
    player_id: playerId,
    teamId,
    team_id: teamId,
    name: clean(row?.name || row?.playerName || row?.player_name),
    playerName: clean(row?.playerName || row?.player_name || row?.name),
    player_name: clean(row?.player_name || row?.playerName || row?.name),
    drillId,
    drill_id: drillId,
    drillName: clean(row?.drillName || row?.drill_name),
    drill_name: clean(row?.drill_name || row?.drillName),
    score,
    date: row?.date || row?.session_date || "",
    session_date: row?.session_date || row?.date || "",
    ts: Number(row?.ts || Date.parse(row?.logged_at || row?.created_at || row?.date || 0) || 0),
    src: "program",
  };
};

export const getAllProgramScoreRows = (programScores = []) =>
  (Array.isArray(programScores) ? programScores : [])
    .map(normalizeProgramScoreRow)
    .filter(Boolean);

export const getProgramScoresForDrill = (programScores = [], drillId) => {
  const targetDrillId = clean(drillId?.id || drillId?.drill_id || drillId?.key || drillId?.slug || drillId);
  const targetDrillName = clean(drillId?.name || drillId?.drillName || drillId?.drill_name);
  if (!targetDrillId && !targetDrillName) return [];
  return getAllProgramScoreRows(programScores).filter((score) =>
    (targetDrillId && score.drillId === targetDrillId) ||
    (targetDrillName && clean(score.drillName || score.drill_name) === targetDrillName)
  );
};

export const getProgramScoresForPlayer = (programScores = [], userEmail, teamId) => {
  const targetEmail = normalizePlayerDataEmail(userEmail);
  const targetTeamId = clean(teamId);
  return getAllProgramScoreRows(programScores).filter((score) => {
    if (targetEmail && normalizePlayerDataEmail(score.email || score.player_email) !== targetEmail && normalizePlayerDataEmail(score.playerId || score.player_id) !== targetEmail) return false;
    if (targetTeamId && score.teamId && score.teamId !== targetTeamId) return false;
    return true;
  });
};

export const getProgramDrillBreakdownRows = (programDrills = [], programScores = [], userEmail, teamId) => {
  const playerScores = getProgramScoresForPlayer(programScores, userEmail, teamId);
  return (Array.isArray(programDrills) ? programDrills : []).map((drill) => {
    const drillId = clean(drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name);
    const drillName = clean(drill?.name || drill?.drillName || drill?.drill_name);
    const rows = playerScores.filter((score) => score.drillId === drillId || (drillName && clean(score.drillName || score.drill_name) === drillName)).sort((a, b) => (a.ts || 0) - (b.ts || 0));
    const last10 = rows.slice(-10).map((score) => score.score);
    const pb = rows.reduce((max, score) => Math.max(max, score.score), 0);
    const avg = rows.length ? Math.round((rows.reduce((sum, score) => sum + score.score, 0) / rows.length) * 10) / 10 : 0;
    const firstAvg = last10.slice(0, Math.ceil(last10.length / 2)).reduce((a, b) => a + b, 0) / (Math.ceil(last10.length / 2) || 1);
    const secondAvg = last10.slice(Math.ceil(last10.length / 2)).reduce((a, b) => a + b, 0) / (Math.floor(last10.length / 2) || 1);
    return {
      ...drill,
      id: drillId,
      src: "program",
      count: rows.length,
      pb,
      avg,
      last10,
      trend: last10.length < 4 ? "steady" : secondAvg > firstAvg ? "up" : secondAvg < firstAvg ? "down" : "steady",
    };
  });
};

export const isProgramDrillScoreForDrill = (score = {}, drill = {}) => {
  const key = clean(drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name);
  const normalized = normalizeProgramScoreRow(score);
  return Boolean(normalized && key && normalized.drillId === key);
};

export const getProgramLeaderboardRows = (programScores = [], programDrillId, players = [], limit) => {
  const drillScores = getProgramScoresForDrill(programScores, programDrillId);
  const rosterPlayers = (Array.isArray(players) ? players : []).filter((p) => p?.role !== "coach");
  const hiddenKeys = new Set(rosterPlayers.filter(isPlayerHiddenFromActiveLeaderboards).flatMap((p) => [p?.email, p?.player_email, p?.player_id, p?.playerId, p?.id, p?.user_id, p?.userId].map(normalizePlayerDataEmail).filter(Boolean)));
  const activePlayers = rosterPlayers.filter((p) => !isPlayerHiddenFromActiveLeaderboards(p));
  const byPlayer = new Map();
  drillScores.forEach((score) => {
    const key = rowPlayerKey(score);
    if (!key || hiddenKeys.has(key)) return;
    const player = activePlayers.find((p) => [p?.email, p?.player_email, p?.player_id, p?.playerId, p?.id, p?.user_id, p?.userId].map(normalizePlayerDataEmail).includes(key));
    const existing = byPlayer.get(key) || { player_id: key, email: rowEmail(score) || normalizePlayerDataEmail(player?.email), name: score?.name || score?.playerName || player?.name || key, total: 0 };
    existing.total += Number(score?.score || 0);
    byPlayer.set(key, existing);
  });
  const rows = [...byPlayer.values()].sort((a, b) => b.total - a.total || String(a.name).localeCompare(String(b.name))).map((row, index) => ({ ...row, rank: index + 1 }));
  return Number.isFinite(limit) ? rows.slice(0, limit) : rows;
};

export const buildProgramDrillLeaderboardRows = ({ scores = [], drill = {}, players = [], limit } = {}) =>
  getProgramLeaderboardRows(scores, drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name, players, limit);
