const clean = (value) => String(value ?? '').trim();
const lower = (value) => clean(value).toLowerCase();
const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const rowDrillKey = (row = {}) => clean(row?.drillId ?? row?.drill_id ?? row?.drillKey ?? row?.drill_key);
const rowPlayerKey = (row = {}) => lower(row?.playerId ?? row?.player_id ?? row?.id ?? row?.userId ?? row?.user_id ?? row?.profileId ?? row?.profile_id);
const rowIdentityKeys = (row = {}) => [row?.email, row?.player_email, row?.playerId, row?.player_id, row?.id, row?.userId, row?.user_id, row?.profileId, row?.profile_id].map(lower).filter(Boolean);

const buildPlayerLookup = (players = [], profiles = []) => {
  const lookup = new Map();
  const remember = (record = {}) => {
    const displayName = clean(record?.player_display_name ?? record?.displayName ?? record?.fullName ?? record?.name ?? record?.playerName ?? record?.player_name);
    const email = lower(record?.email ?? record?.player_email);
    const playerId = rowPlayerKey(record);
    const value = { displayName, email, playerId };
    rowIdentityKeys(record).forEach((key) => {
      if (!lookup.has(key) || (!lookup.get(key)?.displayName && displayName)) lookup.set(key, value);
    });
  };
  [...(Array.isArray(players) ? players : []), ...(Array.isArray(profiles) ? profiles : [])].forEach(remember);
  return lookup;
};

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

export const buildAtHomeLeaderboardRows = ({ scores = [], shotLogs = [], programDrills = [], players = [], profiles = [], limit } = {}) => {
  const byPlayer = new Map();
  const playerLookup = buildPlayerLookup(players, profiles);
  const add = (row = {}, amount = 0) => {
    const total = toNumber(amount);
    if (total <= 0) return;
    const email = lower(row?.email ?? row?.player_email);
    const playerId = rowPlayerKey(row);
    const matchedPlayer = rowIdentityKeys(row).map((identityKey) => playerLookup.get(identityKey)).find(Boolean) || {};
    const key = matchedPlayer.email || email || playerId;
    if (!key) return;
    const displayName = clean(row?.player_display_name ?? row?.displayName ?? row?.name ?? row?.playerName ?? row?.player_name) || matchedPlayer.displayName || (email ? email.split('@')[0] : key);
    const existing = byPlayer.get(key) || { email: matchedPlayer.email || email, playerId: matchedPlayer.playerId || playerId || email, player_id: matchedPlayer.playerId || playerId || email, name: displayName, displayName, player_display_name: displayName, total: 0, score: 0, total_home_shots: 0 };
    if (!existing.email && (matchedPlayer.email || email)) existing.email = matchedPlayer.email || email;
    if (!existing.playerId && (matchedPlayer.playerId || playerId || email)) existing.playerId = matchedPlayer.playerId || playerId || email;
    if (!existing.player_id && existing.playerId) existing.player_id = existing.playerId;
    existing.total += total;
    existing.score = existing.total;
    existing.total_home_shots = existing.total;
    byPlayer.set(key, existing);
  };

  (Array.isArray(scores) ? scores : [])
    .filter((row) => isHomeLeaderboardScoreRow(row, programDrills))
    .forEach((row) => add(row, row?.score));
  (Array.isArray(shotLogs) ? shotLogs : [])
    .filter((row) => isHomeLeaderboardScoreRow(row, programDrills))
    .forEach((row) => add(row, row?.made ?? row?.score ?? row?.total_home_shots));

  const rows = [...byPlayer.values()]
    .sort((a, b) => b.total_home_shots - a.total_home_shots || String(a.player_display_name).localeCompare(String(b.player_display_name)))
    .map((row, index) => ({ ...row, rank: index + 1 }));
  return Number.isFinite(limit) ? rows.slice(0, limit) : rows;
};
