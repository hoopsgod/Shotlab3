import { buildAtHomeLeaderboardRows } from "./homeLeaderboardRows.js";
import { buildActiveRosterIdentity, filterActiveRosterLeaderboardRows, filterActiveRosterRows, isActiveRosterPlayerForTeam, isActiveRosterRow, isInactiveRosterRecord } from "./rosterIdentity.js";
export const normalizePlayerDataEmail = (value = "") => String(value || "").trim().toLowerCase();
const normalizePlayerDataKey = normalizePlayerDataEmail;

const PLAYER_IDENTITY_FIELDS = ["email", "player_email", "player_id", "playerId", "id", "user_id", "userId", "profile_id", "profileId"];
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
const rowRemovedFromTeamId = (row = {}) => String(row?.removedFromTeamId || row?.removed_from_team_id || row?.deletedFromTeamId || row?.deleted_from_team_id || row?.teamLocalDataDeletedFromTeamId || row?.team_local_data_deleted_from_team_id || "");
const isHiddenRosterRecord = isInactiveRosterRecord;

const rosterMergeKeys = (row = {}) => {
  const keys = getRowIdentityKeys(row, ["email", "player_email", "player_id", "playerId", "user_id", "userId", "profile_id", "profileId"]);
  const id = normalizePlayerDataKey(row?.id);
  if (id) keys.push(`id:${id}`);
  return [...new Set(keys)];
};

export const getCoachRosterPlayers = ({ players = [], playerProfiles = [], teamId = "" } = {}) => {
  const rosterByKey = new Map();
  const allPlayers = Array.isArray(players) ? players : [];
  const allProfiles = Array.isArray(playerProfiles) ? playerProfiles : [];
  const targetTeamId = String(teamId || "");
  const inactivePlayerKeys = new Set(allPlayers
    .filter((player) => isHiddenRosterRecord(player) && (rowTeamId(player) === targetTeamId || rowRemovedFromTeamId(player) === targetTeamId))
    .flatMap((player) => rosterMergeKeys(player)));
  const isSuppressedByInactivePlayer = (profile = {}) => rosterMergeKeys(profile).some((key) => inactivePlayerKeys.has(key));
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

  allPlayers
    .filter((player) => rowTeamId(player) === targetTeamId && !isHiddenRosterRecord(player))
    .forEach((player) => {
      const matchingProfile = allProfiles.find((profile) => {
        if (rowTeamId(profile) !== targetTeamId || isHiddenRosterRecord(profile) || isSuppressedByInactivePlayer(profile)) return false;
        const playerEmail = normalizePlayerDataEmail(player?.email || player?.player_email);
        const pEmail = profileEmail(profile);
        if (playerEmail && pEmail && playerEmail === pEmail) return true;
        const playerKeys = rosterMergeKeys(player);
        return rosterMergeKeys(profile).some((key) => playerKeys.includes(key));
      }) || {};
      const row = makePlayerRow(player, matchingProfile);
      remember(row, rosterMergeKeys(row));
    });

  allProfiles
    .filter((profile) => rowTeamId(profile) === targetTeamId && !isHiddenRosterRecord(profile) && !isSuppressedByInactivePlayer(profile))
    .forEach((profile) => {
      const row = makeProfileRow(profile);
      const keys = rosterMergeKeys(row);
      if (!keys.some((key) => rosterByKey.has(key))) remember(row, keys.length ? keys : [`profile:${row.profileId || row.id}`]);
    });


  return [...new Set(rosterByKey.values())].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
};

export const buildCoachPlayerDevelopmentProfile = ({ player = {}, programDrills = [], programScores = [], scores = [], shotLogs = [], homeLeaderboardRows = [], rsvps = [], events = [], scRsvps = [], scLogs = [], teamId = "", today = new Date().toISOString().slice(0, 10) } = {}) => {
  const clean = (value) => String(value ?? "").trim();
  const key = (value) => normalizePlayerDataEmail(value);
  const playerKeys = new Set([player?.email, player?.player_email, player?.userId, player?.user_id, player?.playerId, player?.player_id, player?.profileId, player?.profile_id, player?.id].map(key).filter(Boolean));
  const teamMatches = (row = {}) => !teamId || !clean(row?.teamId || row?.team_id) || clean(row?.teamId || row?.team_id) === clean(teamId);
  const rowMatches = (row = {}) => [row?.email, row?.player_email, row?.userId, row?.user_id, row?.playerId, row?.player_id, row?.profileId, row?.profile_id, row?.id].map(key).some((candidate) => candidate && playerKeys.has(candidate));
  const toNumber = (value) => { const num = Number(value); return Number.isFinite(num) ? num : 0; };
  const parseDate = (row = {}) => clean(row?.date || row?.session_date || row?.created_at || row?.logged_at || (row?.ts ? new Date(row.ts).toISOString().slice(0, 10) : ""));
  const homeScores = (Array.isArray(scores) ? scores : []).filter((row) => teamMatches(row));
  const homeShotLogs = (Array.isArray(shotLogs) ? shotLogs : []).filter((row) => teamMatches(row));
  const homeLeaderboardMatchKeys = playerKeys;
  const matchesHomeLeaderboardPlayer = (row = {}) => [row?.email, row?.player_email, row?.playerId, row?.player_id, row?.id, row?.userId, row?.user_id, row?.profileId, row?.profile_id].map(key).some((candidate) => candidate && homeLeaderboardMatchKeys.has(candidate));
  const providedHomeLeaderboardTotal = (Array.isArray(homeLeaderboardRows) ? homeLeaderboardRows : [])
    .filter(matchesHomeLeaderboardPlayer)
    .reduce((sum, row) => sum + toNumber(row?.total_home_shots ?? row?.total ?? row?.score), 0);
  const computedHomeLeaderboardTotal = buildAtHomeLeaderboardRows({ scores: homeScores, shotLogs: homeShotLogs, programDrills, players: [player], profiles: [player] })
    .filter(matchesHomeLeaderboardPlayer)
    .reduce((sum, row) => sum + toNumber(row?.total_home_shots ?? row?.total ?? row?.score), 0);
  const homeLeaderboardTotal = providedHomeLeaderboardTotal || computedHomeLeaderboardTotal;
  const homeActivityRows = [...homeScores, ...homeShotLogs].filter((row) => rowMatches(row) && clean(row?.src || row?.source || "home").toLowerCase() !== "program");
  const programRows = (Array.isArray(programScores) ? programScores : []).filter((row) => teamMatches(row) && rowMatches(row));
  const drills = (Array.isArray(programDrills) ? programDrills : []);
  const programByDrill = drills.map((drill) => {
    const drillId = clean(drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name);
    const drillName = clean(drill?.name || drill?.drillName || drill?.drill_name);
    const attempts = programRows.filter((row) => clean(row?.drillId || row?.drill_id || row?.drillKey || row?.drill_key) === drillId || (drillName && clean(row?.drillName || row?.drill_name) === drillName)).sort((a, b) => (Number(a?.ts || Date.parse(parseDate(a)) || 0) - Number(b?.ts || Date.parse(parseDate(b)) || 0)));
    return { id: drillId, name: drillName || "Program Drill", attempts: attempts.length, bestScore: attempts.reduce((best, row) => Math.max(best, toNumber(row?.score)), 0), recentScores: attempts.slice(-3).reverse().map((row) => ({ score: toNumber(row?.score), date: parseDate(row) })) };
  }).filter((row) => row.attempts > 0);
  const eventRows = (Array.isArray(rsvps) ? rsvps : []).filter((row) => teamMatches(row) && rowMatches(row));
  const scRsvpRows = (Array.isArray(scRsvps) ? scRsvps : []).filter((row) => teamMatches(row) && rowMatches(row));
  const scLogRows = (Array.isArray(scLogs) ? scLogs : []).filter((row) => teamMatches(row) && rowMatches(row));
  const activityDates = [...homeActivityRows, ...programRows, ...eventRows, ...scRsvpRows, ...scLogRows].map(parseDate).filter(Boolean).sort();
  const lastActivityDate = activityDates.at(-1) || "";
  const daysSince = lastActivityDate ? Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastActivityDate}T00:00:00Z`)) / 86400000) : Infinity;
  return {
    identity: { name: clean(player?.name) || clean(player?.displayName) || clean(player?.email) || "Roster Player", email: key(player?.email || player?.player_email), playerId: clean(player?.playerId || player?.player_id || player?.id || player?.userId || player?.user_id || player?.profileId) },
    totalAtHomeMakes: homeLeaderboardTotal,
    totalProgramAttempts: programRows.length,
    programByDrill,
    eventSummary: { rsvps: eventRows.length, attended: eventRows.filter((row) => ["going", "attended", "yes", "confirmed"].includes(clean(row?.status || row?.response || "going").toLowerCase())).length, totalEvents: (Array.isArray(events) ? events : []).filter(teamMatches).length },
    scSummary: { rsvps: scRsvpRows.length, logs: scLogRows.length },
    lastActivityDate,
    statusLabel: !lastActivityDate || daysSince > 30 ? "No Recent Activity" : daysSince > 10 ? "Needs Follow-Up" : "Active",
    hasActivity: homeActivityRows.length > 0 || programRows.length > 0 || eventRows.length > 0 || scRsvpRows.length > 0 || scLogRows.length > 0,
  };
};


export const getPlayerDisplayIdentity = (player = {}) => {
  const name = String(player?.name || "").trim();
  const email = normalizePlayerDataEmail(player?.email || player?.playerId || "");
  return { name: name || email || "Selected player", email };
};

export const isActiveRosterPlayer = (player = {}, teamId = "") => isActiveRosterPlayerForTeam(player, teamId);

export const isPlayerHiddenFromActiveLeaderboards = (player = {}) => isInactiveRosterRecord(player) || player?.teamId == null;


export const getActiveTeamPlayers = (players = [], teamId = "") => buildActiveRosterIdentity(players, teamId).players;

export const getActiveTeamPlayerIdentity = (players = [], teamId = "") => buildActiveRosterIdentity(players, teamId);

export const getActiveTeamPlayerEmails = (players = [], teamId = "") => getActiveTeamPlayerIdentity(players, teamId).emails;

export const getActiveTeamPlayerNames = (players = [], teamId = "") => getActiveTeamPlayerIdentity(players, teamId).names;

export const isActiveTeamPlayerRow = (row = {}, activeTeamPlayerEmails = [], activeTeamPlayerKeys = activeTeamPlayerEmails) => isActiveRosterRow(row, activeTeamPlayerEmails, activeTeamPlayerKeys);

export const filterActiveTeamPlayerRows = (rows = [], activeTeamPlayerEmails = [], activeTeamPlayerKeys = activeTeamPlayerEmails) => filterActiveRosterRows(rows, activeTeamPlayerEmails, activeTeamPlayerKeys);

export const isActiveTeamLeaderboardRow = (row = {}, activeTeamPlayerKeys = [], activeTeamPlayerEmails = [], activeTeamPlayerNames = []) => filterActiveRosterLeaderboardRows([row], activeTeamPlayerKeys, activeTeamPlayerEmails, activeTeamPlayerNames).length > 0;

export const filterActiveTeamLeaderboardRows = (rows = [], activeTeamPlayerKeys = [], activeTeamPlayerEmails = [], activeTeamPlayerNames = []) => filterActiveRosterLeaderboardRows(rows, activeTeamPlayerKeys, activeTeamPlayerEmails, activeTeamPlayerNames);

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
