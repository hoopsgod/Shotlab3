const clean = (value) => String(value ?? '').trim();
const lower = (value) => clean(value).toLowerCase();
const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const rowDrillKey = (row = {}) => clean(row?.drillId ?? row?.drill_id ?? row?.drillKey ?? row?.drill_key);

export const isHomeLeaderboardScoreRow = (row = {}, programDrills = []) => {
  const src = lower(row?.src);
  if (src === 'program') return false;
  if (src === 'home') return true;
  const programDrillIds = new Set((Array.isArray(programDrills) ? programDrills : [])
    .flatMap((drill) => [drill?.id, drill?.drill_id, drill?.key, drill?.slug])
    .map(clean)
    .filter(Boolean));
  const drillKey = rowDrillKey(row);
  return !drillKey || !programDrillIds.has(drillKey);
};

export const buildAtHomeLeaderboardRows = ({ scores = [], shotLogs = [], programDrills = [], limit } = {}) => {
  const byPlayer = new Map();
  const add = (row = {}, amount = 0) => {
    const total = toNumber(amount);
    if (total <= 0) return;
    const email = lower(row?.email ?? row?.player_email);
    const playerId = lower(row?.playerId ?? row?.player_id ?? row?.id ?? row?.userId ?? row?.user_id);
    const key = email || playerId;
    if (!key) return;
    const displayName = clean(row?.player_display_name ?? row?.displayName ?? row?.name ?? row?.playerName ?? row?.player_name) || (email ? email.split('@')[0] : key);
    const existing = byPlayer.get(key) || { email, playerId: playerId || email, player_id: playerId || email, name: displayName, displayName, player_display_name: displayName, total: 0, score: 0, total_home_shots: 0 };
    existing.total += total;
    existing.score = existing.total;
    existing.total_home_shots = existing.total;
    byPlayer.set(key, existing);
  };

  (Array.isArray(scores) ? scores : [])
    .filter((row) => isHomeLeaderboardScoreRow(row, programDrills))
    .forEach((row) => add(row, row?.score));
  (Array.isArray(shotLogs) ? shotLogs : [])
    .forEach((row) => add(row, row?.made ?? row?.score ?? row?.total_home_shots));

  const rows = [...byPlayer.values()]
    .sort((a, b) => b.total_home_shots - a.total_home_shots || String(a.player_display_name).localeCompare(String(b.player_display_name)))
    .map((row, index) => ({ ...row, rank: index + 1 }));
  return Number.isFinite(limit) ? rows.slice(0, limit) : rows;
};
