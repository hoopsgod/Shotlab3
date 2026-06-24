export const normalizePlayerDataEmail = (value = "") => String(value || "").trim().toLowerCase();
const normalizePlayerDataKey = normalizePlayerDataEmail;

const PLAYER_IDENTITY_FIELDS = ["email", "player_email", "player_id", "playerId", "id", "user_id", "userId"];
const CHALLENGE_IDENTITY_FIELDS = ["email", "player_email", "player_id", "playerId", "user_id", "userId", "from", "to", "challengerEmail", "opponentEmail"];

const getRowIdentityKeys = (row = {}, fields = PLAYER_IDENTITY_FIELDS) => fields
  .map((field) => normalizePlayerDataKey(row?.[field]))
  .filter(Boolean);

const toIdentitySet = (values = []) => values instanceof Set ? values : new Set(Array.isArray(values) ? values : []);


const isGenericPlayerName = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "player" || normalized === "unknown player";
};

const profileFullName = (profile = {}) => [profile?.firstName, profile?.lastName]
  .map((part) => String(part || "").trim())
  .filter(Boolean)
  .join(" ");

export const resolvePlayerDisplayName = (player = {}, profiles = []) => {
  const playerEmail = normalizePlayerDataEmail(player?.email || player?.player_email);
  const playerIds = getRowIdentityKeys(player, ["player_id", "playerId", "id", "user_id", "userId"]);
  const profile = (Array.isArray(profiles) ? profiles : []).find((candidate) => {
    const profileEmail = normalizePlayerDataEmail(candidate?.email || candidate?.player_email || candidate?.userId || candidate?.user_id);
    if (playerEmail && profileEmail === playerEmail) return true;
    const profileIds = getRowIdentityKeys(candidate, ["player_id", "playerId", "id", "user_id", "userId"]);
    return playerIds.some((id) => profileIds.includes(id));
  }) || {};
  const candidates = [
    player?.name,
    player?.displayName,
    player?.fullName,
    profile?.name,
    profile?.displayName,
    profile?.fullName,
    profileFullName(profile),
  ].map((value) => String(value || "").trim()).filter((value) => !isGenericPlayerName(value));
  if (candidates.length) return candidates[0];
  const email = playerEmail || normalizePlayerDataEmail(profile?.email || profile?.player_email || profile?.userId || profile?.user_id);
  if (email) return email.split("@")[0];
  return "Unknown Player";
};

const profileEmail = (profile = {}) => {
  const explicitEmail = normalizePlayerDataEmail(profile?.email || profile?.player_email);
  if (explicitEmail) return explicitEmail;
  const userId = normalizePlayerDataEmail(profile?.userId || profile?.user_id);
  return userId.includes("@") ? userId : "";
};

const rowTeamId = (row = {}) => String(row?.teamId || row?.team_id || "");
const isHiddenRosterRecord = (row = {}) => (
  row?.role === "coach" ||
  row?.archived === true ||
  row?.hideFromLeaderboards === true ||
  ["archived", "removed", "team_local_data_deleted"].includes(String(row?.rosterStatus || row?.roster_status || "").toLowerCase())
);

const rosterMergeKeys = (row = {}) => {
  const keys = getRowIdentityKeys(row, ["email", "player_email", "player_id", "playerId", "user_id", "userId"]);
  const id = normalizePlayerDataKey(row?.id);
  if (id) keys.push(`id:${id}`);
  return [...new Set(keys)];
};

export const getCoachRosterPlayers = ({ players = [], playerProfiles = [], teamId = "" } = {}) => {
  const rosterByKey = new Map();
  const remember = (row, keys) => keys.filter(Boolean).forEach((key) => rosterByKey.set(key, row));
  const makeProfileRow = (profile = {}) => {
    const email = profileEmail(profile);
    const profileId = String(profile?.id || "").trim();
    const playerId = String(profile?.playerId || profile?.player_id || profile?.userId || profile?.user_id || "").trim();
    const name = resolvePlayerDisplayName({ ...profile, email, playerId, id: profileId }, [profile]);
    return {
      ...profile,
      id: profileId || playerId || email,
      profileId: profileId || undefined,
      email,
      playerId,
      name,
      firstName: String(profile?.firstName || profile?.first_name || "").trim(),
      lastName: String(profile?.lastName || profile?.last_name || "").trim(),
      jerseyNumber: String(profile?.jerseyNumber || profile?.jersey_number || "").trim(),
      teamId: rowTeamId(profile),
      source: "profile",
    };
  };
  const makePlayerRow = (player = {}, profile = {}) => {
    const email = normalizePlayerDataEmail(player?.email || player?.player_email) || profileEmail(profile);
    const playerId = String(player?.playerId || player?.player_id || player?.id || player?.userId || player?.user_id || "").trim();
    const profileId = String(profile?.id || "").trim();
    const firstName = String(profile?.firstName || profile?.first_name || "").trim();
    const lastName = String(profile?.lastName || profile?.last_name || "").trim();
    return {
      ...player,
      profileId: profileId || undefined,
      email,
      playerId,
      name: resolvePlayerDisplayName({ ...player, email, playerId }, profileId ? [profile] : []),
      firstName,
      lastName,
      jerseyNumber: String(profile?.jerseyNumber || profile?.jersey_number || player?.jerseyNumber || player?.jersey_number || "").trim(),
      teamId: rowTeamId(player) || rowTeamId(profile),
      source: profileId ? "merged" : "player",
    };
  };

  (Array.isArray(players) ? players : [])
    .filter((player) => rowTeamId(player) === String(teamId || "") && !isHiddenRosterRecord(player))
    .forEach((player) => {
      const matchingProfile = (Array.isArray(playerProfiles) ? playerProfiles : []).find((profile) => {
        if (rowTeamId(profile) !== String(teamId || "") || isHiddenRosterRecord(profile)) return false;
        const playerEmail = normalizePlayerDataEmail(player?.email || player?.player_email);
        const pEmail = profileEmail(profile);
        if (playerEmail && pEmail && playerEmail === pEmail) return true;
        const playerKeys = rosterMergeKeys(player);
        return rosterMergeKeys(profile).some((key) => playerKeys.includes(key));
      }) || {};
      const row = makePlayerRow(player, matchingProfile);
      remember(row, rosterMergeKeys(row));
    });

  (Array.isArray(playerProfiles) ? playerProfiles : [])
    .filter((profile) => rowTeamId(profile) === String(teamId || "") && !isHiddenRosterRecord(profile))
    .forEach((profile) => {
      const row = makeProfileRow(profile);
      const keys = rosterMergeKeys(row);
      if (!keys.some((key) => rosterByKey.has(key))) remember(row, keys.length ? keys : [`profile:${row.profileId || row.id}`]);
    });

  return [...new Set(rosterByKey.values())].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
};


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
  const keys = activePlayers
    .flatMap((player) => getRowIdentityKeys(player, ["email", "player_id", "playerId", "id", "user_id", "userId"]))
    .filter(Boolean);
  return {
    players: activePlayers,
    emails,
    names,
    keys,
    emailSet: new Set(emails),
    nameSet: new Set(names),
    keySet: new Set(keys),
  };
};

export const getActiveTeamPlayerEmails = (players = [], teamId = "") => getActiveTeamPlayerIdentity(players, teamId).emails;

export const getActiveTeamPlayerNames = (players = [], teamId = "") => getActiveTeamPlayerIdentity(players, teamId).names;

export const isActiveTeamPlayerRow = (row = {}, activeTeamPlayerEmails = [], activeTeamPlayerKeys = activeTeamPlayerEmails) => {
  const activeEmailSet = toIdentitySet(activeTeamPlayerEmails);
  const activeKeySet = toIdentitySet(activeTeamPlayerKeys);
  const rowKeys = getRowIdentityKeys(row);
  return rowKeys.some((key) => activeKeySet.has(key) || activeEmailSet.has(key));
};

export const filterActiveTeamPlayerRows = (rows = [], activeTeamPlayerEmails = [], activeTeamPlayerKeys = activeTeamPlayerEmails) => (Array.isArray(rows) ? rows : [])
  .filter((row) => isActiveTeamPlayerRow(row, activeTeamPlayerEmails, activeTeamPlayerKeys));

export const isActiveTeamLeaderboardRow = (row = {}, activeTeamPlayerKeys = [], activeTeamPlayerEmails = [], activeTeamPlayerNames = []) => {
  if (isActiveTeamPlayerRow(row, activeTeamPlayerEmails, activeTeamPlayerKeys)) return true;
  const activeNameSet = toIdentitySet(activeTeamPlayerNames);
  const displayName = String(row?.player_display_name || row?.name || row?.playerName || "").trim().toLowerCase();
  return Boolean(displayName && activeNameSet.has(displayName));
};

export const filterActiveTeamLeaderboardRows = (rows = [], activeTeamPlayerKeys = [], activeTeamPlayerEmails = [], activeTeamPlayerNames = []) => (Array.isArray(rows) ? rows : [])
  .filter((row) => isActiveTeamLeaderboardRow(row, activeTeamPlayerKeys, activeTeamPlayerEmails, activeTeamPlayerNames))
  .map((row, index) => ({ ...row, rank: index + 1 }));

export const filterActiveTeamChallengeRows = (rows = [], activeTeamPlayerKeys = [], activeTeamPlayerEmails = activeTeamPlayerKeys) => {
  const activeKeySet = toIdentitySet(activeTeamPlayerKeys);
  const activeEmailSet = toIdentitySet(activeTeamPlayerEmails);
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const participants = getRowIdentityKeys(row, CHALLENGE_IDENTITY_FIELDS);
    return participants.length === 0 || participants.every((key) => activeKeySet.has(key) || activeEmailSet.has(key));
  });
};

export const requireCoachPlayerDataAccess = ({ coach, targetPlayer, teamId }) => {
  const activeTeamId = teamId || coach?.teamId;
  if (!coach || coach.role !== "coach" || !activeTeamId) return { ok: false, err: "Not authorized" };
  if (!targetPlayer || targetPlayer.role === "coach") return { ok: false, err: "Player not found on roster" };
  if (targetPlayer.teamId !== activeTeamId) return { ok: false, err: "Player not found on coach team" };
  return { ok: true, teamId: activeTeamId };
};

const playerMatchesIdentity = (player = {}, identity = "") => {
  const target = normalizePlayerDataKey(identity);
  if (!target) return false;
  return getRowIdentityKeys(player, ["email", "player_id", "playerId", "id", "user_id", "userId"]).includes(target);
};

export const archivePlayerForTeam = ({ players = [], coach, playerEmail, now = Date.now() }) => {
  const targetPlayer = players.find((player) => playerMatchesIdentity(player, playerEmail));
  const guard = requireCoachPlayerDataAccess({ coach, targetPlayer, teamId: coach?.teamId });
  if (!guard.ok) return { ...guard, players };
  return {
    ok: true,
    players: players.map((player) => playerMatchesIdentity(player, playerEmail)
      ? { ...player, archived: true, rosterStatus: "archived", archivedAt: now, archivedBy: coach.email, hideFromLeaderboards: true }
      : player),
  };
};

export const removePlayerFromTeam = ({ players = [], coach, playerEmail, now = Date.now() }) => {
  const targetPlayer = players.find((player) => playerMatchesIdentity(player, playerEmail));
  const guard = requireCoachPlayerDataAccess({ coach, targetPlayer, teamId: coach?.teamId });
  if (!guard.ok) return { ...guard, players };
  return {
    ok: true,
    players: players.map((player) => playerMatchesIdentity(player, playerEmail)
      ? { ...player, teamId: null, rosterStatus: "removed", removedFromTeamId: guard.teamId, removedAt: now, removedBy: coach.email, hideFromLeaderboards: true }
      : player),
  };
};

const rowTeamMatches = (row = {}, teamId = "") => String(row?.teamId || row?.team_id || "") === String(teamId || "");
const rowPlayerMatchesAny = (row = {}, identityKeys = []) => getRowIdentityKeys(row).some((key) => identityKeys.has(key));
const challengeInvolvesAnyPlayerKey = (row = {}, identityKeys = []) => getRowIdentityKeys(row, CHALLENGE_IDENTITY_FIELDS).some((key) => identityKeys.has(key));

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
  const targetPlayer = players.find((player) => playerMatchesIdentity(player, playerEmail));
  const guard = requireCoachPlayerDataAccess({ coach, targetPlayer, teamId: coach?.teamId });
  if (!guard.ok) return { ...guard };
  const identity = getPlayerDisplayIdentity(targetPlayer);
  const requiredTokens = [identity.email, identity.name].filter(Boolean).map((token) => token.toLowerCase());
  const confirmed = requiredTokens.length > 0 && requiredTokens.every((token) => String(confirmationText || "").toLowerCase().includes(token));
  if (!confirmed) return { ok: false, err: "Confirmation must include the player name/email." };
  const teamId = guard.teamId;
  const targetIdentityKeys = new Set(getRowIdentityKeys(targetPlayer, ["email", "player_id", "playerId", "id", "user_id", "userId"]));
  const isSelectedTeamRow = (row) => rowTeamMatches(row, teamId) && rowPlayerMatchesAny(row, targetIdentityKeys);
  return {
    ok: true,
    players: players.map((player) => playerMatchesIdentity(player, playerEmail)
      ? { ...player, teamId: null, rosterStatus: "team_local_data_deleted", removedFromTeamId: teamId, teamLocalDataDeletedAt: now, teamLocalDataDeletedBy: coach.email, hideFromLeaderboards: true }
      : player),
    playerProfiles: playerProfiles.filter((profile) => !(rowTeamMatches(profile, teamId) && rowPlayerMatchesAny(profile, targetIdentityKeys))),
    scores: scores.filter((row) => !isSelectedTeamRow(row)),
    shotLogs: shotLogs.filter((row) => !isSelectedTeamRow(row)),
    rsvps: rsvps.filter((row) => !isSelectedTeamRow(row)),
    scRsvps: scRsvps.filter((row) => !isSelectedTeamRow(row)),
    scLogs: scLogs.filter((row) => !isSelectedTeamRow(row)),
    challenges: challenges.filter((row) => !(rowTeamMatches(row, teamId) && challengeInvolvesAnyPlayerKey(row, targetIdentityKeys))),
  };
};
