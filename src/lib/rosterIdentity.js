const clean = (value) => String(value ?? "").trim();
export const normalizeRosterIdentityValue = (value = "") => clean(value).toLowerCase();

export const ROSTER_IDENTITY_FIELDS = ["email", "player_email", "playerId", "player_id", "userId", "user_id", "profileId", "profile_id"];
const ROSTER_STATUS_BLOCKLIST = new Set(["archived", "removed", "team_local_data_deleted", "deleted", "hidden"]);

export const getRosterTeamId = (row = {}) => clean(row?.teamId || row?.team_id);

export const getRosterIdentityKeys = (row = {}, fields = ROSTER_IDENTITY_FIELDS) => fields
  .map((field) => normalizeRosterIdentityValue(row?.[field]))
  .filter(Boolean);

export const isInactiveRosterRecord = (row = {}) => {
  const status = normalizeRosterIdentityValue(row?.rosterStatus || row?.roster_status || row?.status);
  return row?.role === "coach" || row?.archived === true || row?.deleted === true || row?.removed === true || row?.hidden === true || row?.teamLocalDataDeleted === true || row?.team_local_data_deleted === true || row?.hideFromLeaderboards === true || row?.hide_from_leaderboards === true || ROSTER_STATUS_BLOCKLIST.has(status);
};

export const isActiveRosterPlayerForTeam = (row = {}, teamId = "") => {
  const targetTeamId = clean(teamId);
  if (!row || !targetTeamId || getRosterTeamId(row) !== targetTeamId) return false;
  return !isInactiveRosterRecord(row) && getRosterIdentityKeys(row).length > 0;
};

const setWithTeamId = (values = [], teamId = "") => {
  const set = new Set(values.filter(Boolean));
  Object.defineProperty(set, "teamId", { value: clean(teamId), enumerable: false, configurable: true });
  return set;
};

export const buildActiveRosterIdentity = (players = [], teamId = "") => {
  const targetTeamId = clean(teamId);
  const activePlayers = (Array.isArray(players) ? players : []).filter((player) => isActiveRosterPlayerForTeam(player, targetTeamId));
  const emails = activePlayers.map((player) => normalizeRosterIdentityValue(player?.email || player?.player_email)).filter(Boolean);
  const names = activePlayers.map((player) => normalizeRosterIdentityValue(player?.name || player?.displayName || player?.player_display_name)).filter(Boolean);
  const keys = activePlayers.flatMap((player) => getRosterIdentityKeys(player)).filter(Boolean);
  return {
    players: activePlayers,
    emails,
    names,
    keys,
    emailSet: setWithTeamId(emails, targetTeamId),
    nameSet: setWithTeamId(names, targetTeamId),
    keySet: setWithTeamId(keys, targetTeamId),
    teamId: targetTeamId,
  };
};

const toSet = (values = []) => values instanceof Set ? values : new Set(Array.isArray(values) ? values : []);
const setTeamId = (...sets) => sets.map((set) => set?.teamId).find(Boolean) || "";

export const isActiveRosterRow = (row = {}, activeEmails = [], activeKeys = activeEmails, teamId = "") => {
  const activeEmailSet = toSet(activeEmails);
  const activeKeySet = toSet(activeKeys);
  const targetTeamId = clean(teamId) || setTeamId(activeKeySet, activeEmailSet);
  const rowTeamId = getRosterTeamId(row);
  if (targetTeamId && rowTeamId && rowTeamId !== targetTeamId) return false;
  if (isInactiveRosterRecord(row)) return false;
  return getRosterIdentityKeys(row).some((key) => activeKeySet.has(key) || activeEmailSet.has(key));
};

export const filterActiveRosterRows = (rows = [], activeEmails = [], activeKeys = activeEmails, teamId = "") => (Array.isArray(rows) ? rows : [])
  .filter((row) => isActiveRosterRow(row, activeEmails, activeKeys, teamId));

export const isActiveRosterLeaderboardRow = (row = {}, activeKeys = [], activeEmails = [], activeNames = [], teamId = "") => {
  if (isActiveRosterRow(row, activeEmails, activeKeys, teamId)) return true;
  const targetTeamId = clean(teamId) || setTeamId(toSet(activeKeys), toSet(activeEmails), toSet(activeNames));
  const rowTeamId = getRosterTeamId(row);
  if (targetTeamId && rowTeamId && rowTeamId !== targetTeamId) return false;
  if (isInactiveRosterRecord(row)) return false;
  const activeNameSet = toSet(activeNames);
  const displayName = normalizeRosterIdentityValue(row?.player_display_name || row?.name || row?.playerName || row?.player_name);
  return Boolean(displayName && activeNameSet.has(displayName));
};

export const filterActiveRosterLeaderboardRows = (rows = [], activeKeys = [], activeEmails = [], activeNames = [], teamId = "") => (Array.isArray(rows) ? rows : [])
  .filter((row) => isActiveRosterLeaderboardRow(row, activeKeys, activeEmails, activeNames, teamId))
  .map((row, index) => ({ ...row, rank: index + 1 }));
