import { getBackendRuntime } from './backendConfig.js'

export const TEAM_ROLE = {
  COACH: 'coach',
  PLAYER: 'player',
}

export const TEAM_MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DISABLED: 'disabled',
}

export const TEAM_AUTH_TABLES = {
  users: 'users',
  teams: 'teams',
  team_members: 'team_members',
  join_codes: 'join_codes',
  coach_priorities: 'coach_priorities',
  drills: 'drills',
  shot_logs: 'shot_logs',
  sessions: 'sessions',
  leaderboard_entries: 'leaderboard_entries',
}

const demoNoop = async (value = null) => ({ data: value, error: null, meta: { mode: 'demo' } })

export function createTeamAuthService({ supabaseClient }) {
  const runtime = getBackendRuntime()
  const isDemo = runtime.demoFallback || !supabaseClient

  if (isDemo) {
    return {
      runtime,
      users: { upsert: (row) => demoNoop(row), getByAuthId: () => demoNoop(null) },
      teams: { create: (row) => demoNoop(row), getById: () => demoNoop(null) },
      teamMembers: { add: (row) => demoNoop(row), listByTeamId: () => demoNoop([]) },
      joinCodes: { create: (row) => demoNoop(row), consume: () => demoNoop(null), listByTeamId: () => demoNoop([]) },
      coachPriorities: { upsert: (row) => demoNoop(row) },
      drills: { listByTeamId: () => demoNoop([]) },
      shotLogs: { create: (row) => demoNoop(row), listByPlayerId: () => demoNoop([]) },
      sessions: { upsert: (row) => demoNoop(row) },
      leaderboards: { listByTeamId: () => demoNoop([]) },
    }
  }

  const upsertOne = (table, row, onConflict) => supabaseClient.from(table).upsert(row, { onConflict })

  return {
    runtime,
    users: {
      upsert: (row) => upsertOne(TEAM_AUTH_TABLES.users, row, 'id'),
      getByAuthId: async (auth_user_id) => supabaseClient.from(TEAM_AUTH_TABLES.users).select().then((res) => ({ ...res, auth_user_id })),
    },
    teams: {
      create: (row) => upsertOne(TEAM_AUTH_TABLES.teams, row, 'id'),
      getById: async (id) => supabaseClient.from(TEAM_AUTH_TABLES.teams).select().then((res) => ({ ...res, id })),
    },
    teamMembers: {
      add: (row) => upsertOne(TEAM_AUTH_TABLES.team_members, row, 'team_id,user_id'),
      listByTeamId: async (team_id) => supabaseClient.from(TEAM_AUTH_TABLES.team_members).select().then((res) => ({ ...res, team_id })),
    },
    joinCodes: {
      create: (row) => upsertOne(TEAM_AUTH_TABLES.join_codes, row, 'code'),
      consume: async (code) => ({ data: null, error: null, meta: { code } }),
      listByTeamId: async (team_id) => supabaseClient.from(TEAM_AUTH_TABLES.join_codes).select().then((res) => ({ ...res, team_id })),
    },
    coachPriorities: { upsert: (row) => upsertOne(TEAM_AUTH_TABLES.coach_priorities, row, 'team_id') },
    drills: { listByTeamId: async (team_id) => supabaseClient.from(TEAM_AUTH_TABLES.drills).select().then((res) => ({ ...res, team_id })) },
    shotLogs: {
      create: (row) => upsertOne(TEAM_AUTH_TABLES.shot_logs, row, 'id'),
      listByPlayerId: async (player_id) => supabaseClient.from(TEAM_AUTH_TABLES.shot_logs).select().then((res) => ({ ...res, player_id })),
    },
    sessions: { upsert: (row) => upsertOne(TEAM_AUTH_TABLES.sessions, row, 'id') },
    leaderboards: { listByTeamId: async (team_id) => supabaseClient.from(TEAM_AUTH_TABLES.leaderboard_entries).select().then((res) => ({ ...res, team_id })) },
  }
}
