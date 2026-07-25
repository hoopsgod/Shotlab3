const text = (value) => String(value ?? '').trim();
const lower = (value) => text(value).toLowerCase();
const list = (value) => (Array.isArray(value) ? value : []);
const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const teamOf = (row = {}) => text(row.teamId ?? row.team_id);
const dateOf = (row = {}) => text(row.date ?? row.session_date ?? row.createdAt ?? row.created_at ?? row.loggedAt ?? row.logged_at);
const identityKeys = (row = {}) => [
  row.email,
  row.player_email,
  row.playerEmail,
  row.playerId,
  row.player_id,
  row.userId,
  row.user_id,
  row.profileId,
  row.profile_id,
].map(lower).filter(Boolean);

const displayName = (row = {}) => text(
  row.player_display_name ?? row.displayName ?? row.player_name ?? row.playerName ?? row.name ?? row.email,
) || 'Player';

const isActiveRosterPlayer = (row = {}) => {
  const role = lower(row.role ?? row.player_role ?? 'player');
  const status = lower(row.rosterStatus ?? row.roster_status ?? row.status ?? 'active');
  return role !== 'coach'
    && !['removed', 'deleted', 'archived', 'inactive'].includes(status)
    && row.archived !== true
    && row.deleted !== true
    && row.hideFromLeaderboards !== true
    && row.hide_from_leaderboards !== true;
};

const buildRosterLookup = (players = [], teamId = '') => {
  const lookup = new Map();
  list(players)
    .filter(isActiveRosterPlayer)
    .filter((player) => !teamId || !teamOf(player) || teamOf(player) === text(teamId))
    .forEach((player) => {
      const normalized = {
        email: lower(player.email ?? player.player_email),
        playerId: text(player.playerId ?? player.player_id ?? player.id ?? player.userId ?? player.user_id ?? player.profileId ?? player.profile_id),
        name: displayName(player),
      };
      identityKeys(player).forEach((key) => lookup.set(key, normalized));
      if (normalized.email) lookup.set(normalized.email, normalized);
      if (normalized.playerId) lookup.set(lower(normalized.playerId), normalized);
    });
  return lookup;
};

const archiveRange = (archive = {}) => ({
  start: text(archive.seasonStartDate ?? archive.season_start_date),
  end: text(archive.seasonEndDate ?? archive.season_end_date),
});

const insideRange = (row, range) => {
  const date = dateOf(row).slice(0, 10);
  if (!date || (!range.start && !range.end)) return false;
  if (range.start && date < range.start) return false;
  if (range.end && date > range.end) return false;
  return true;
};

const outsideArchivedRanges = (rows, archives) => {
  const ranges = list(archives).map(archiveRange).filter((range) => range.start || range.end);
  if (!ranges.length) return list(rows);
  return list(rows).filter((row) => !ranges.some((range) => insideRange(row, range)));
};

const rowMatchesTeam = (row, teamId) => !teamId || !teamOf(row) || teamOf(row) === text(teamId);

const resolvePlayer = (row, rosterLookup) => identityKeys(row).map((key) => rosterLookup.get(key)).find(Boolean) || null;

const rankRows = (counts, limit = 10) => [...counts.values()]
  .filter((row) => row.total > 0)
  .sort((a, b) => b.total - a.total || a.player_display_name.localeCompare(b.player_display_name) || a.player_id.localeCompare(b.player_id))
  .slice(0, limit)
  .map((row, index) => ({
    ...row,
    rank: index + 1,
    score: row.total,
    total_home_shots: row.total,
  }));

const addCount = (counts, row, rosterLookup, amount = 1) => {
  const player = resolvePlayer(row, rosterLookup);
  if (!player) return;
  const key = player.email || lower(player.playerId);
  if (!key) return;
  const existing = counts.get(key) || {
    email: player.email,
    playerId: player.playerId,
    player_id: player.playerId,
    name: player.name,
    displayName: player.name,
    player_display_name: player.name,
    total: 0,
  };
  existing.total += number(amount);
  counts.set(key, existing);
};

const attendedEvent = (row = {}) => row.attended === true || lower(row.status) === 'attended' || lower(row.rsvp_status) === 'attended';

export function buildCurrentEventParticipationRows({ rsvps = [], players = [], teamId = '', seasonArchives = [], limit = 10 } = {}) {
  const roster = buildRosterLookup(players, teamId);
  const counts = new Map();
  outsideArchivedRanges(rsvps, seasonArchives)
    .filter((row) => rowMatchesTeam(row, teamId) && attendedEvent(row))
    .forEach((row) => addCount(counts, row, roster, 1));
  return rankRows(counts, limit);
}

export function buildCurrentStrengthParticipationRows({ scLogs = [], players = [], teamId = '', seasonArchives = [], limit = 10 } = {}) {
  const roster = buildRosterLookup(players, teamId);
  const counts = new Map();
  outsideArchivedRanges(scLogs, seasonArchives)
    .filter((row) => rowMatchesTeam(row, teamId))
    .forEach((row) => addCount(counts, row, roster, 1));
  return rankRows(counts, limit);
}

const archivedRows = (archives, snapshotKeys) => list(archives).flatMap((archive) => {
  for (const key of snapshotKeys) {
    if (Array.isArray(archive?.[key])) return archive[key];
  }
  return [];
});

export function buildAllTimeEventParticipationRows({ rsvps = [], players = [], teamId = '', seasonArchives = [], limit = 10 } = {}) {
  const roster = buildRosterLookup(players, teamId);
  const counts = new Map();
  archivedRows(seasonArchives, ['eventRsvpSnapshot', 'event_rsvp_snapshot', 'rsvpsSnapshot'])
    .filter(attendedEvent)
    .forEach((row) => addCount(counts, row, roster, 1));
  outsideArchivedRanges(rsvps, seasonArchives)
    .filter((row) => rowMatchesTeam(row, teamId) && attendedEvent(row))
    .forEach((row) => addCount(counts, row, roster, 1));
  return rankRows(counts, limit);
}

export function buildAllTimeStrengthParticipationRows({ scLogs = [], players = [], teamId = '', seasonArchives = [], limit = 10 } = {}) {
  const roster = buildRosterLookup(players, teamId);
  const counts = new Map();
  archivedRows(seasonArchives, ['scLogSnapshot', 'sc_log_snapshot', 'scLogsSnapshot'])
    .forEach((row) => addCount(counts, row, roster, 1));
  outsideArchivedRanges(scLogs, seasonArchives)
    .filter((row) => rowMatchesTeam(row, teamId))
    .forEach((row) => addCount(counts, row, roster, 1));
  return rankRows(counts, limit);
}
