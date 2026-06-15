export const normalizePlayerDataEmail = (value = "") => String(value || "").trim().toLowerCase();

export const getPlayerDisplayIdentity = (player = {}) => {
  const name = String(player?.name || "").trim();
  const email = normalizePlayerDataEmail(player?.email || player?.playerId || "");
  return { name: name || email || "Selected player", email };
};

export const isActiveRosterPlayer = (player = {}, teamId = "") => {
  if (!player || player.role === "coach") return false;
  if (!teamId || player.teamId !== teamId) return false;
  return player.archived !== true && player.rosterStatus !== "archived";
};

export const isPlayerHiddenFromActiveLeaderboards = (player = {}) => (
  player?.hideFromLeaderboards === true ||
  player?.archived === true ||
  player?.rosterStatus === "archived" ||
  player?.teamId == null
);


export const getActiveTeamPlayers = (players = [], teamId = "") => (Array.isArray(players) ? players : [])
  .filter((player) => isActiveRosterPlayer(player, teamId));

export const getActiveTeamPlayerIdentity = (players = [], teamId = "") => {
  const activePlayers = getActiveTeamPlayers(players, teamId);
  const emails = activePlayers
    .map((player) => normalizePlayerDataEmail(player?.email))
    .filter(Boolean);
  const names = activePlayers
    .map((player) => String(player?.name || "").trim().toLowerCase())
    .filter(Boolean);
  return {
    players: activePlayers,
    emails,
    names,
    emailSet: new Set(emails),
    nameSet: new Set(names),
  };
};

export const getActiveTeamPlayerEmails = (players = [], teamId = "") => getActiveTeamPlayerIdentity(players, teamId).emails;

export const getActiveTeamPlayerNames = (players = [], teamId = "") => getActiveTeamPlayerIdentity(players, teamId).names;

export const isActiveTeamPlayerRow = (row = {}, activeTeamPlayerEmails = []) => {
  const activeSet = activeTeamPlayerEmails instanceof Set ? activeTeamPlayerEmails : new Set(activeTeamPlayerEmails);
  const email = normalizePlayerDataEmail(row?.email || row?.player_email || row?.playerId || row?.player_id || row?.userId || row?.user_id);
  return Boolean(email && activeSet.has(email));
};

export const filterActiveTeamPlayerRows = (rows = [], activeTeamPlayerEmails = []) => (Array.isArray(rows) ? rows : [])
  .filter((row) => isActiveTeamPlayerRow(row, activeTeamPlayerEmails));

export const isActiveTeamLeaderboardRow = (row = {}, activeTeamPlayerEmails = [], activeTeamPlayerNames = []) => {
  if (isActiveTeamPlayerRow(row, activeTeamPlayerEmails)) return true;
  const activeNameSet = activeTeamPlayerNames instanceof Set ? activeTeamPlayerNames : new Set(activeTeamPlayerNames);
  const displayName = String(row?.player_display_name || row?.name || row?.playerName || "").trim().toLowerCase();
  return Boolean(displayName && activeNameSet.has(displayName));
};

export const filterActiveTeamLeaderboardRows = (rows = [], activeTeamPlayerEmails = [], activeTeamPlayerNames = []) => (Array.isArray(rows) ? rows : [])
  .filter((row) => isActiveTeamLeaderboardRow(row, activeTeamPlayerEmails, activeTeamPlayerNames));

export const filterActiveTeamChallengeRows = (rows = [], activeTeamPlayerEmails = []) => {
  const activeSet = activeTeamPlayerEmails instanceof Set ? activeTeamPlayerEmails : new Set(activeTeamPlayerEmails);
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const participants = [row?.email, row?.playerId, row?.player_id, row?.from, row?.to, row?.challengerEmail, row?.opponentEmail]
      .map(normalizePlayerDataEmail)
      .filter(Boolean);
    return participants.length === 0 || participants.every((email) => activeSet.has(email));
  });
};

export const requireCoachPlayerDataAccess = ({ coach, targetPlayer, teamId }) => {
  const activeTeamId = teamId || coach?.teamId;
  if (!coach || coach.role !== "coach" || !activeTeamId) return { ok: false, err: "Not authorized" };
  if (!targetPlayer || targetPlayer.role === "coach") return { ok: false, err: "Player not found on roster" };
  if (targetPlayer.teamId !== activeTeamId) return { ok: false, err: "Player not found on coach team" };
  return { ok: true, teamId: activeTeamId };
};

export const archivePlayerForTeam = ({ players = [], coach, playerEmail, now = Date.now() }) => {
  const email = normalizePlayerDataEmail(playerEmail);
  const targetPlayer = players.find((player) => normalizePlayerDataEmail(player?.email) === email);
  const guard = requireCoachPlayerDataAccess({ coach, targetPlayer, teamId: coach?.teamId });
  if (!guard.ok) return { ...guard, players };
  return {
    ok: true,
    players: players.map((player) => normalizePlayerDataEmail(player?.email) === email
      ? { ...player, archived: true, rosterStatus: "archived", archivedAt: now, archivedBy: coach.email, hideFromLeaderboards: true }
      : player),
  };
};

export const removePlayerFromTeam = ({ players = [], coach, playerEmail, now = Date.now() }) => {
  const email = normalizePlayerDataEmail(playerEmail);
  const targetPlayer = players.find((player) => normalizePlayerDataEmail(player?.email) === email);
  const guard = requireCoachPlayerDataAccess({ coach, targetPlayer, teamId: coach?.teamId });
  if (!guard.ok) return { ...guard, players };
  return {
    ok: true,
    players: players.map((player) => normalizePlayerDataEmail(player?.email) === email
      ? { ...player, teamId: null, rosterStatus: "removed", removedFromTeamId: guard.teamId, removedAt: now, removedBy: coach.email, hideFromLeaderboards: true }
      : player),
  };
};

const rowTeamMatches = (row = {}, teamId = "") => String(row?.teamId || row?.team_id || "") === String(teamId || "");
const rowPlayerMatches = (row = {}, email = "") => normalizePlayerDataEmail(row?.email || row?.player_email || row?.playerId || row?.player_id || row?.userId || row?.user_id) === email;
const challengeInvolvesPlayer = (row = {}, email = "") => [row?.email, row?.playerId, row?.player_id, row?.from, row?.to, row?.challengerEmail, row?.opponentEmail].some((value) => normalizePlayerDataEmail(value) === email);

export const deleteTeamLocalPlayerData = ({
  players = [],
  playerProfiles = [],
  scores = [],
  shotLogs = [],
  rsvps = [],
  scRsvps = [],
  scLogs = [],
  challenges = [],
  coach,
  playerEmail,
  confirmationText = "",
  now = Date.now(),
}) => {
  const email = normalizePlayerDataEmail(playerEmail);
  const targetPlayer = players.find((player) => normalizePlayerDataEmail(player?.email) === email);
  const guard = requireCoachPlayerDataAccess({ coach, targetPlayer, teamId: coach?.teamId });
  if (!guard.ok) return { ...guard };
  const identity = getPlayerDisplayIdentity(targetPlayer);
  const requiredTokens = [identity.email, identity.name].filter(Boolean).map((token) => token.toLowerCase());
  const confirmed = requiredTokens.length > 0 && requiredTokens.every((token) => String(confirmationText || "").toLowerCase().includes(token));
  if (!confirmed) return { ok: false, err: "Confirmation must include the player name/email." };
  const teamId = guard.teamId;
  const isSelectedTeamRow = (row) => rowTeamMatches(row, teamId) && rowPlayerMatches(row, email);
  return {
    ok: true,
    players: players.map((player) => normalizePlayerDataEmail(player?.email) === email
      ? { ...player, teamId: null, rosterStatus: "team_local_data_deleted", removedFromTeamId: teamId, teamLocalDataDeletedAt: now, teamLocalDataDeletedBy: coach.email, hideFromLeaderboards: true }
      : player),
    playerProfiles: playerProfiles.filter((profile) => !(rowTeamMatches(profile, teamId) && normalizePlayerDataEmail(profile?.userId || profile?.email) === email)),
    scores: scores.filter((row) => !isSelectedTeamRow(row)),
    shotLogs: shotLogs.filter((row) => !isSelectedTeamRow(row)),
    rsvps: rsvps.filter((row) => !isSelectedTeamRow(row)),
    scRsvps: scRsvps.filter((row) => !isSelectedTeamRow(row)),
    scLogs: scLogs.filter((row) => !isSelectedTeamRow(row)),
    challenges: challenges.filter((row) => !(rowTeamMatches(row, teamId) && challengeInvolvesPlayer(row, email))),
  };
};
