import { getActiveTeamPlayerIdentity } from "./playerDataManagement.js";

const asText = (value = "") => String(value ?? "").trim();
const asKey = (value = "") => asText(value).toLowerCase();

const rosterKeyForPlayer = (player = {}) => (
  asText(player?.player_id || player?.playerId || player?.id || player?.user_id || player?.userId || player?.email)
);

const scoreDrillKey = (score = {}) => asText(score?.drill_id || score?.drillId);
const drillKey = (drill = {}) => asText(drill?.id || drill?.drill_id || drill?.slug || drill?.key || drill?.name);

export const resolveProgramScorePlayerId = ({ players = [], user = {} } = {}) => {
  const email = asKey(user?.email);
  const teamId = asText(user?.teamId || user?.team_id);
  const rosterPlayer = (Array.isArray(players) ? players : []).find((player) => (
    asKey(player?.email) === email &&
    (!teamId || asText(player?.teamId || player?.team_id) === teamId)
  ));
  return rosterKeyForPlayer(rosterPlayer) || asText(user?.player_id || user?.playerId || user?.id || user?.email);
};

export const buildProgramScoreRow = ({ id, user = {}, players = [], drill = {}, score, date, ts = Date.now() } = {}) => {
  const numericScore = Number(score);
  const teamId = asText(user?.teamId || user?.team_id);
  const drillId = drillKey(drill);
  if (!id || !asText(user?.email) || !teamId || !drillId || !Number.isFinite(numericScore)) return null;
  return {
    id,
    email: asKey(user.email),
    playerId: resolveProgramScorePlayerId({ players, user }),
    teamId,
    name: asText(user?.name),
    drillId,
    drillName: asText(drill?.name) || drillId,
    score: numericScore,
    date: asText(date),
    ts: Number(ts),
    src: "program",
  };
};

export const isValidProgramScoreInput = (value, drill = {}) => {
  if (asText(value) === "") return false;
  const numericScore = Number(value);
  if (!Number.isFinite(numericScore) || !Number.isInteger(numericScore)) return false;
  const allowZero = drill?.allowZeroScore === true || drill?.allowZero === true || Number(drill?.minScore) === 0;
  if (numericScore < 0 || (!allowZero && numericScore === 0)) return false;
  const max = Number(drill?.max);
  return !(Number.isFinite(max) && max > 0 && numericScore > max);
};

export const buildProgramDrillLeaderboardRows = ({ scores = [], drills = [], players = [], teamId = "", drill = null } = {}) => {
  const activeIdentity = getActiveTeamPlayerIdentity(players, teamId);
  const targetDrillKey = drill ? drillKey(drill) : "";
  const knownDrillByKey = new Map((Array.isArray(drills) ? drills : []).flatMap((item) => {
    const id = drillKey(item);
    return [[id, item], [asKey(item?.name), item]].filter(([key]) => key);
  }));
  const totals = new Map();

  for (const score of (Array.isArray(scores) ? scores : [])) {
    if (score?.src !== "program") continue;
    if (teamId && asText(score?.teamId || score?.team_id) !== asText(teamId)) continue;
    const rowDrillKey = scoreDrillKey(score) || drillKey(knownDrillByKey.get(asKey(score?.drillName || score?.drill_name)));
    if (targetDrillKey && rowDrillKey !== targetDrillKey) continue;
    const identityKeys = [score?.player_id, score?.playerId, score?.email, score?.user_id, score?.userId].map(asKey).filter(Boolean);
    const isActive = identityKeys.some((key) => activeIdentity.keySet.has(key) || activeIdentity.emailSet.has(key));
    if (!isActive) continue;
    const player = activeIdentity.players.find((p) => identityKeys.some((key) => [p?.player_id, p?.playerId, p?.id, p?.user_id, p?.userId, p?.email].map(asKey).includes(key)));
    const bucketKey = rosterKeyForPlayer(player) || identityKeys[0];
    const existing = totals.get(bucketKey) || { player_id: bucketKey, email: asKey(player?.email || score?.email), name: asText(player?.name || score?.name || score?.drillName), total: 0 };
    existing.total += Number(score?.score) || 0;
    totals.set(bucketKey, existing);
  }

  return Array.from(totals.values())
    .sort((a, b) => b.total - a.total)
    .map((row, index) => ({ ...row, rank: index + 1 }));
};
