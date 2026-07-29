import { useEffect, useMemo, useState } from "react";

const clean = (value) => String(value ?? "").trim();
const key = (value) => clean(value).toLowerCase();
const safeArray = (value) => (Array.isArray(value) ? value : []);
const normalizeWords = (value) => key(value).replace(/[^a-z0-9]+/g, " ").trim();

const parseStored = (storage, storageKey, fallback) => {
  try {
    const raw = storage?.getItem?.(storageKey);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const rowTeamId = (row = {}) => clean(row?.teamId || row?.team_id);
const rowDate = (row = {}) => clean(row?.date || row?.session_date || row?.created_at || row?.logged_at).slice(0, 10);
const rowDrillId = (row = {}) => clean(row?.drillId || row?.drill_id || row?.drillKey || row?.drill_key || row?.id);
const rowDrillName = (row = {}) => clean(row?.drillName || row?.drill_name || row?.name || row?.title);
const playerName = (row = {}) => clean(row?.name || row?.displayName || row?.playerName || row?.player_name || [row?.firstName, row?.lastName].filter(Boolean).join(" ")) || "Player";

const identityKeys = (row = {}) => [
  row?.email,
  row?.player_email,
  row?.playerId,
  row?.player_id,
  row?.userId,
  row?.user_id,
  row?.profileId,
  row?.profile_id,
  row?.id,
].map(key).filter(Boolean);

const identityMatches = (row = {}, identities = new Set()) => identityKeys(row).some((candidate) => identities.has(candidate));

const isActivePlayer = (player = {}) => {
  if (key(player?.role) === "coach" || player?.isCoach === true) return false;
  if (player?.deleted === true || player?.archived === true || player?.hideFromLeaderboards === true) return false;
  const status = key(player?.rosterStatus || player?.roster_status || player?.status);
  return !["removed", "deleted", "archived", "inactive"].includes(status);
};

const findTeamId = ({ session = {}, teams = [], players = [], joinCode = "", teamName = "" } = {}) => {
  const sessionTeam = clean(session?.teamId || session?.team_id);
  if (sessionTeam) return sessionTeam;
  const wantedCode = key(joinCode);
  const wantedName = key(teamName);
  const team = safeArray(teams).find((candidate) =>
    (wantedCode && key(candidate?.joinCode || candidate?.join_code) === wantedCode)
    || (wantedName && key(candidate?.name || candidate?.teamName) === wantedName));
  if (team?.id) return clean(team.id);
  const coach = safeArray(players).find((candidate) => key(candidate?.role) === "coach" || candidate?.isCoach === true);
  return clean(coach?.teamId || coach?.team_id);
};

const findTrackableDrill = ({ priorityText = "", drills = [], programDrills = [] } = {}) => {
  const wanted = normalizeWords(priorityText);
  if (!wanted) return null;
  const candidates = [
    ...safeArray(drills).map((drill) => ({ ...drill, lane: "home" })),
    ...safeArray(programDrills).map((drill) => ({ ...drill, lane: "program" })),
  ];
  return candidates.find((drill) => {
    const candidateName = normalizeWords(drill?.name || drill?.drillName || drill?.drill_name);
    const candidateId = normalizeWords(drill?.id || drill?.drill_id || drill?.key || drill?.slug);
    return Boolean(candidateName && (candidateName === wanted || candidateName.includes(wanted) || wanted.includes(candidateName)))
      || Boolean(candidateId && (candidateId === wanted || candidateId.includes(wanted) || wanted.includes(candidateId)));
  }) || null;
};

const scoreMatchesDrill = (row = {}, drill = {}) => {
  const targetId = normalizeWords(drill?.id || drill?.drill_id || drill?.key || drill?.slug);
  const targetName = normalizeWords(drill?.name || drill?.drillName || drill?.drill_name);
  const scoreId = normalizeWords(rowDrillId(row));
  const scoreName = normalizeWords(rowDrillName(row));
  return Boolean(targetId && scoreId && targetId === scoreId)
    || Boolean(targetName && scoreName && (targetName === scoreName || targetName.includes(scoreName) || scoreName.includes(targetName)));
};

const newestDate = (rows = []) => safeArray(rows).map(rowDate).filter(Boolean).sort().at(-1) || "";

export const deriveCoachAssignmentOutcomes = ({
  teamId = "",
  prioritiesByTeam = {},
  players = [],
  playerProfiles = [],
  drills = [],
  programDrills = [],
  scores = [],
  programScores = [],
  shotLogs = [],
  scLogs = [],
  weekStart = "",
} = {}) => {
  const scopedTeamId = clean(teamId);
  const priority = prioritiesByTeam?.[scopedTeamId] || null;
  const priorityText = clean(priority?.priorityDrillText);
  const drill = findTrackableDrill({ priorityText, drills, programDrills });
  if (!scopedTeamId || !priority || !priorityText || !drill) {
    return { trackable: false, teamId: scopedTeamId, priorityDrill: priorityText, rows: [], total: 0, completedCount: 0, activeOtherCount: 0, notStartedCount: 0, completionRate: 0 };
  }

  const profilesByIdentity = new Map();
  safeArray(playerProfiles).forEach((profile) => identityKeys(profile).forEach((identity) => profilesByIdentity.set(identity, profile)));
  const rosterMap = new Map();
  safeArray(players).filter(isActivePlayer).forEach((player) => {
    const playerTeam = rowTeamId(player);
    if (playerTeam && playerTeam !== scopedTeamId) return;
    const identities = identityKeys(player);
    const profile = identities.map((identity) => profilesByIdentity.get(identity)).find(Boolean);
    const canonical = identities[0] || identityKeys(profile)[0];
    if (!canonical) return;
    rosterMap.set(canonical, { ...profile, ...player, _identities: new Set([...identities, ...identityKeys(profile)]) });
  });

  safeArray(playerProfiles).filter(isActivePlayer).forEach((profile) => {
    const profileTeam = rowTeamId(profile);
    if (profileTeam && profileTeam !== scopedTeamId) return;
    const identities = identityKeys(profile);
    const canonical = identities[0];
    if (!canonical || [...rosterMap.values()].some((player) => identities.some((identity) => player._identities.has(identity)))) return;
    rosterMap.set(canonical, { ...profile, _identities: new Set(identities) });
  });

  const scoreRows = [...safeArray(scores), ...safeArray(programScores)].filter((row) => {
    const rowTeam = rowTeamId(row);
    const date = rowDate(row);
    return (!rowTeam || rowTeam === scopedTeamId) && (!weekStart || !date || date >= weekStart);
  });
  const activityRows = [...scoreRows, ...safeArray(shotLogs), ...safeArray(scLogs)].filter((row) => {
    const rowTeam = rowTeamId(row);
    const date = rowDate(row);
    return (!rowTeam || rowTeam === scopedTeamId) && (!weekStart || !date || date >= weekStart);
  });

  const rows = [...rosterMap.values()].map((player) => {
    const identities = player._identities;
    const playerScores = scoreRows.filter((row) => identityMatches(row, identities));
    const matchingScores = playerScores.filter((row) => scoreMatchesDrill(row, drill));
    const playerActivity = activityRows.filter((row) => identityMatches(row, identities));
    const completed = matchingScores.length > 0;
    const activeOther = !completed && playerActivity.length > 0;
    const status = completed ? "completed" : activeOther ? "active-other" : "not-started";
    return {
      key: [...identities][0],
      name: playerName(player),
      status,
      completed,
      activeOther,
      latestDate: newestDate(completed ? matchingScores : playerActivity),
      attempts: matchingScores.length,
    };
  }).sort((a, b) => {
    const order = { "not-started": 0, "active-other": 1, completed: 2 };
    return order[a.status] - order[b.status] || a.name.localeCompare(b.name);
  });

  const completedCount = rows.filter((row) => row.completed).length;
  const activeOtherCount = rows.filter((row) => row.activeOther).length;
  const notStartedCount = Math.max(rows.length - completedCount - activeOtherCount, 0);
  const completionRate = rows.length ? Math.round((completedCount / rows.length) * 100) : 0;

  return {
    trackable: rows.length > 0,
    teamId: scopedTeamId,
    priorityDrill: clean(drill?.name || priorityText),
    focus: clean(priority?.todayFocusText),
    challenge: clean(priority?.challengeText),
    lane: drill?.lane || "home",
    rows,
    total: rows.length,
    completedCount,
    activeOtherCount,
    notStartedCount,
    completionRate,
  };
};

export const readCoachAssignmentOutcomesFromStorage = ({ storage, joinCode = "", teamName = "", now = new Date() } = {}) => {
  if (!storage) return deriveCoachAssignmentOutcomes();
  const session = parseStored(storage, "sl:session", {});
  const teams = parseStored(storage, "sl:teams", []);
  const players = parseStored(storage, "sl:players", []);
  const playerProfiles = parseStored(storage, "sl:player-profiles", []);
  const teamId = findTeamId({ session, teams, players, joinCode, teamName });
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const weekStart = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  return deriveCoachAssignmentOutcomes({
    teamId,
    prioritiesByTeam: parseStored(storage, "sl:coach-priorities", {}),
    players,
    playerProfiles,
    drills: parseStored(storage, "sl:drills", []),
    programDrills: parseStored(storage, "sl:program-drills", []),
    scores: parseStored(storage, "sl:scores", []),
    programScores: parseStored(storage, "sl:program-scores", []),
    shotLogs: parseStored(storage, "sl:shotlogs", []),
    scLogs: parseStored(storage, "sl:sc-logs", []),
    weekStart,
  });
};

export const useCoachAssignmentOutcomes = ({ joinCode = "", teamName = "" } = {}) => {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(refresh, 15_000);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, []);
  return useMemo(() => readCoachAssignmentOutcomesFromStorage({ storage: window.localStorage, joinCode, teamName }), [joinCode, teamName, revision]);
};
