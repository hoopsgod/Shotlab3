import { isInactiveRosterRecord } from "./rosterIdentity.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const normalize = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalize(value).toLowerCase();
const toArray = (value) => (Array.isArray(value) ? value : []);
const deepClone = (value) => JSON.parse(JSON.stringify(value ?? null));

export const ROLLOVER_PLAYER_STATUSES = Object.freeze({
  RETURNING: "returning",
  GRADUATED: "graduated",
  NOT_RETURNING: "not_returning",
});

export const validateSeasonDate = (value) => {
  const raw = normalize(value);
  if (!ISO_DATE.test(raw)) return false;
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw;
};

const playerRole = (row = {}) => normalizeKey(row.role || row.player_role || row.playerRole);
const playerStatus = (row = {}) => normalizeKey(
  row.rosterStatus || row.roster_status || row.status || row.membershipStatus || row.membership_status,
);

export const isEligibleArchivedPlayer = (row = {}) => {
  const role = playerRole(row);
  const status = playerStatus(row);
  if (["coach", "assistant_coach"].includes(role) || row.isCoach === true) return false;
  if (row.removedFromTeam === true || row.removed_from_team === true) return false;
  if (row.removedFromTeamId || row.removed_from_team_id || row.deletedFromTeamId || row.deleted_from_team_id) return false;
  if (row.teamLocalDataDeleted === true || row.team_local_data_deleted === true) return false;
  if (["inactive", "removed", "removed_from_team", "archived", "deleted"].includes(status)) return false;
  return !isInactiveRosterRecord(row);
};

export const stablePlayerIdentity = (row = {}) => {
  const candidates = [
    row.userId,
    row.user_id,
    row.profileId,
    row.profile_id,
    row.playerId,
    row.player_id,
    row.email,
    row.player_email,
  ].map(normalize).filter(Boolean);
  return candidates[0] || "";
};

const archiveTeamId = (archive = {}) => normalize(archive.teamId || archive.team_id);
const archiveId = (archive = {}) => normalize(archive.id || archive.archiveId || archive.archive_id);
const archiveRoster = (archive = {}) => toArray(
  archive.rosterSnapshot || archive.roster_snapshot || archive.snapshot?.roster || archive.snapshot?.rosterSnapshot,
);

export function validateSeasonRolloverInput({
  coach,
  teamId,
  sourceArchive,
  seasonName,
  seasonStartDate,
  projectedEndDate = "",
  existingActiveSeasons = [],
} = {}) {
  const normalizedTeamId = normalize(teamId);
  if (!coach || !["coach", "assistant_coach"].includes(normalizeKey(coach.role))) {
    return { ok: false, error: "Only an authenticated coach can start a new season.", code: "forbidden" };
  }
  if (!normalizedTeamId || normalize(coach.teamId || coach.team_id) !== normalizedTeamId) {
    return { ok: false, error: "The coach is not authorized for the selected team.", code: "wrong_team" };
  }
  if (!sourceArchive || archiveTeamId(sourceArchive) !== normalizedTeamId) {
    return { ok: false, error: "The selected archive does not belong to the active team.", code: "archive_wrong_team" };
  }
  if (!archiveId(sourceArchive)) {
    return { ok: false, error: "A durable source archive is required.", code: "archive_required" };
  }

  const normalizedSeasonName = normalize(seasonName);
  if (!normalizedSeasonName) return { ok: false, error: "Season name is required.", code: "season_name_required" };
  if (!validateSeasonDate(seasonStartDate)) {
    return { ok: false, error: "A valid season start date is required.", code: "invalid_start_date" };
  }
  if (projectedEndDate && !validateSeasonDate(projectedEndDate)) {
    return { ok: false, error: "Projected end date must be a valid date.", code: "invalid_end_date" };
  }
  if (projectedEndDate && seasonStartDate > projectedEndDate) {
    return { ok: false, error: "Projected end date cannot be before the season start date.", code: "invalid_date_range" };
  }

  const duplicate = toArray(existingActiveSeasons).some((season) => (
    normalize(season.teamId || season.team_id) === normalizedTeamId
    && normalizeKey(season.name || season.seasonName || season.season_name) === normalizeKey(normalizedSeasonName)
    && normalizeKey(season.status || season.lifecycleStatus || season.lifecycle_status || "active") === "active"
  ));
  if (duplicate) return { ok: false, error: "An active season with this name already exists.", code: "duplicate_active_season" };

  return {
    ok: true,
    value: {
      teamId: normalizedTeamId,
      sourceArchiveId: archiveId(sourceArchive),
      seasonName: normalizedSeasonName,
      seasonStartDate,
      projectedEndDate: projectedEndDate || null,
    },
  };
}

const normalizeSelections = (selections = {}) => {
  if (Array.isArray(selections)) {
    return new Map(selections.map((entry) => [normalize(entry.identity || entry.playerId || entry.email), entry.status]));
  }
  return new Map(Object.entries(selections).map(([identity, status]) => [normalize(identity), status]));
};

export function buildSeasonRolloverPlan({
  coach,
  teamId,
  sourceArchive,
  seasonName,
  seasonStartDate,
  projectedEndDate = "",
  playerSelections = {},
  selectedProgramDrillIds = [],
  selectedEventTemplateIds = [],
  selectedStrengthTemplateIds = [],
  existingActiveSeasons = [],
  transitionId,
  now = () => new Date().toISOString(),
} = {}) {
  const validation = validateSeasonRolloverInput({
    coach,
    teamId,
    sourceArchive,
    seasonName,
    seasonStartDate,
    projectedEndDate,
    existingActiveSeasons,
  });
  if (!validation.ok) return validation;

  const normalizedTransitionId = normalize(transitionId);
  if (!normalizedTransitionId) {
    return { ok: false, error: "A transition identifier is required for duplicate protection.", code: "transition_id_required" };
  }

  const selections = normalizeSelections(playerSelections);
  const excludedPlayers = [];
  const playerDecisions = [];
  const returningMemberships = [];
  const seenIdentities = new Set();

  for (const player of archiveRoster(sourceArchive)) {
    const identity = stablePlayerIdentity(player);
    if (!identity || seenIdentities.has(normalizeKey(identity))) continue;
    seenIdentities.add(normalizeKey(identity));

    if (!isEligibleArchivedPlayer(player)) {
      excludedPlayers.push({ identity, reason: "ineligible_archived_player" });
      continue;
    }

    const selectedStatus = selections.get(identity) || selections.get(normalizeKey(identity)) || ROLLOVER_PLAYER_STATUSES.NOT_RETURNING;
    const status = Object.values(ROLLOVER_PLAYER_STATUSES).includes(selectedStatus)
      ? selectedStatus
      : ROLLOVER_PLAYER_STATUSES.NOT_RETURNING;

    const decision = {
      identity,
      status,
      name: player.name || player.displayName || player.email || "Player",
      email: player.email || player.player_email || "",
      userId: player.userId || player.user_id || "",
      profileId: player.profileId || player.profile_id || "",
      playerId: player.playerId || player.player_id || player.id || "",
    };
    playerDecisions.push(decision);

    if (status === ROLLOVER_PLAYER_STATUSES.RETURNING) {
      returningMemberships.push({
        ...decision,
        membershipStatus: "active",
        joinedAt: null,
        statistics: {
          homeMakes: 0,
          programScore: 0,
          attendance: 0,
          eventRsvps: 0,
          strengthAttendance: 0,
          streak: 0,
        },
      });
    }
  }

  const createdAt = now();
  return {
    ok: true,
    plan: deepClone({
      transitionId: normalizedTransitionId,
      createdAt,
      createdBy: normalize(coach.id || coach.userId || coach.user_id || coach.email),
      activeSeason: {
        id: null,
        teamId: validation.value.teamId,
        name: validation.value.seasonName,
        startDate: validation.value.seasonStartDate,
        projectedEndDate: validation.value.projectedEndDate,
        sourceArchiveId: validation.value.sourceArchiveId,
        lifecycleStatus: "active",
      },
      playerDecisions,
      returningMemberships,
      excludedPlayers,
      reusableStructure: {
        programDrillIds: [...new Set(toArray(selectedProgramDrillIds).map(normalize).filter(Boolean))],
        eventTemplateIds: [...new Set(toArray(selectedEventTemplateIds).map(normalize).filter(Boolean))],
        strengthTemplateIds: [...new Set(toArray(selectedStrengthTemplateIds).map(normalize).filter(Boolean))],
      },
      carryForwardPolicy: {
        historicalScores: false,
        attendance: false,
        rsvps: false,
        completedEvents: false,
        completedStrengthSessions: false,
        streaks: false,
      },
    }),
  };
}
