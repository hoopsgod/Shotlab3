import { normalizePlayerDataEmail, isPlayerHiddenFromActiveLeaderboards } from "./playerDataManagement.js";
import { getRosterIdentityKeys, isActiveRosterPlayerForTeam } from "./rosterIdentity.js";

const clean = (value) => String(value ?? "").trim();
let programScoreRowSequence = 0;

export const validateProgramDrillScore = (value, drill = {}) => {
  const score = value === "" || value === null || value === undefined ? null : Number(value);
  if (!Number.isFinite(score)) return { ok: false, error: "Score is required." };
  if (score < 0) return { ok: false, error: "Score cannot be negative." };
  if (score === 0 && drill?.allowZeroScore !== true && drill?.minScore !== 0) return { ok: false, error: "Score must be greater than 0." };
  const rawMax = drill?.max;
  const max = rawMax === null || rawMax === undefined || rawMax === "" ? null : Number(rawMax);
  if (max !== null && Number.isFinite(max) && score > max) return { ok: false, error: `Score cannot exceed ${max}.` };
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
    id: clean(id) || `score_${now}_${++programScoreRowSequence}`,
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
const rowPlayerKey = (row = {}) => normalizePlayerDataEmail(row?.playerId || row?.player_id || row?.userId || row?.user_id || row?.profileId || row?.profile_id || row?.email || row?.player_email || row?.id);
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
    playerId,
    teamId,
    name: clean(row?.name || row?.playerName || row?.player_name),
    drillId,
    drillName: clean(row?.drillName || row?.drill_name),
    score,
    date: row?.date || row?.session_date || "",
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
    (targetDrillName && score.drillName === targetDrillName)
  );
};

export const getProgramScoresForPlayer = (programScores = [], userEmail, teamId) => {
  const targetEmail = normalizePlayerDataEmail(userEmail);
  const targetTeamId = clean(teamId);
  return getAllProgramScoreRows(programScores).filter((score) => {
    if (targetEmail && score.email !== targetEmail && score.playerId !== targetEmail) return false;
    if (targetTeamId && score.teamId && score.teamId !== targetTeamId) return false;
    return true;
  });
};

export const getProgramDrillBreakdownRows = (programDrills = [], programScores = [], userEmail, teamId) => {
  const playerScores = getProgramScoresForPlayer(programScores, userEmail, teamId);
  return (Array.isArray(programDrills) ? programDrills : []).map((drill) => {
    const drillId = clean(drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name);
    const drillName = clean(drill?.name || drill?.drillName || drill?.drill_name);
    const rows = playerScores.filter((score) => score.drillId === drillId || (drillName && score.drillName === drillName)).sort((a, b) => (a.ts || 0) - (b.ts || 0));
    const last10 = rows.slice(-10).map((score) => score.score);
    const pb = rows.reduce((max, score) => Math.max(max, score.score), 0);
    const avg = rows.length ? Math.round((rows.reduce((sum, score) => sum + score.score, 0) / rows.length) * 10) / 10 : 0;
    const half = Math.ceil(last10.length / 2);
    const firstAvg = last10.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
    const secondAvg = last10.slice(half).reduce((a, b) => a + b, 0) / (last10.length - half || 1);
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
  const selectedDrillId = clean(programDrillId?.id || programDrillId?.drill_id || programDrillId?.key || programDrillId?.slug || programDrillId);
  const selectedDrillName = clean(programDrillId?.name || programDrillId?.drillName || programDrillId?.drill_name);
  const rosterPlayers = (Array.isArray(players) ? players : []).filter((p) => p?.role !== "coach");
  const rosterTeamPlayer = rosterPlayers.find((p) => clean(p?.teamId || p?.team_id));
  const rosterTeamId = clean(programDrillId?.teamId || programDrillId?.team_id || rosterTeamPlayer?.teamId || rosterTeamPlayer?.team_id);
  const hiddenKeys = new Set(rosterPlayers.filter(isPlayerHiddenFromActiveLeaderboards).flatMap((p) => getRosterIdentityKeys(p)));
  const activePlayers = rosterPlayers.filter((p) => rosterTeamId ? isActiveRosterPlayerForTeam(p, rosterTeamId) : !isPlayerHiddenFromActiveLeaderboards(p));
  const requireRosterMatch = activePlayers.length > 0;
  const byPlayer = new Map();
  drillScores.forEach((score) => {
    const key = score.playerId;
    if (!key || hiddenKeys.has(key)) return;
    const player = activePlayers.find((p) => getRosterIdentityKeys(p).includes(key));
    if (requireRosterMatch && !player) return;
    const email = normalizePlayerDataEmail(player?.email) || score.email;
    const scoreName = score.name;
    const fallbackName = email ? email.split("@")[0] : key;
    const displayName = clean(player?.name || (scoreName.toLowerCase() === "player" ? "" : scoreName) || fallbackName);
    const existing = byPlayer.get(key) || { playerId: key, player_id: key, email, name: displayName, displayName, player_display_name: displayName, total: 0, score: 0, total_home_shots: 0, attempts: 0, drillId: selectedDrillId || score.drillId, drillName: selectedDrillName || score.drillName };
    const attemptScore = score.score;
    existing.attempts += 1;
    existing.total = Math.max(existing.total, attemptScore);
    existing.score = existing.total;
    existing.total_home_shots = existing.total;
    byPlayer.set(key, existing);
  });
  const rows = [...byPlayer.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)).map((row, index) => ({ ...row, rank: index + 1 }));
  return Number.isFinite(limit) ? rows.slice(0, limit) : rows;
};

export const buildProgramDrillLeaderboardRows = ({ scores = [], drill = {}, players = [], limit } = {}) =>
  getProgramLeaderboardRows(scores, drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name, players, limit);
