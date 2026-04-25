import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeInviteCode } from '../functions/_utils/invite.js';
import { bootstrapCoachSignup, startInviteContext, confirmInviteContext } from '../functions/_utils/inviteFlowCore.js';

class FakeInviteEngine {
  constructor() {
    this.teamSeq = 0;
    this.inviteSeq = 0;
    this.membershipSeq = 0;
    this.teams = new Map();
    this.invites = new Map();
    this.sessions = new Map();
    this.memberships = new Map();
  }

  now() {
    return Date.now();
  }

  randomId(prefix, n) {
    return `${prefix}-${n}`;
  }

  createInviteCode() {
    return `ABCD${String(this.inviteSeq + 1).padStart(4, '0')}`;
  }

  getRosterForTeam(teamId) {
    return [...this.memberships.values()]
      .filter((membership) => membership.teamId === teamId)
      .map((membership) => membership.userId)
      .sort();
  }

  findInviteByCode(inviteCode) {
    const normalized = normalizeInviteCode(inviteCode);
    for (const invite of this.invites.values()) {
      if (invite.normalizedCode === normalized) return invite;
    }
    return null;
  }

  async callRpc(fnName, params) {
    if (fnName === 'lookup_team_invite_by_code') {
      const normalized = normalizeInviteCode(params.p_invite_code);
      const invite = this.findInviteByCode(normalized);
      if (!invite) {
        return [{
          normalized_code: normalized,
          lookup_hash_prefix: normalized ? `hash_${normalized.slice(0, 6)}` : '',
          lookup_count: 0,
          team_id: '',
          invite_state: '',
          expires_at: null,
        }];
      }

      return [{
        normalized_code: normalized,
        lookup_hash_prefix: `hash_${normalized.slice(0, 6)}`,
        lookup_count: 1,
        team_id: invite.teamId,
        invite_state: invite.state,
        expires_at: invite.expiresAt,
      }];
    }

    if (fnName === 'coach_signup_create_team_and_invite') {
      this.teamSeq += 1;
      this.inviteSeq += 1;
      const teamId = this.randomId('team', this.teamSeq);
      const inviteId = this.randomId('invite', this.inviteSeq);
      const inviteCode = this.createInviteCode();
      const normalizedCode = normalizeInviteCode(inviteCode);
      const expiresAt = params.p_invite_ttl_hours == null
        ? null
        : new Date(this.now() + params.p_invite_ttl_hours * 3600 * 1000).toISOString();

      const team = {
        id: teamId,
        name: params.p_team_name || 'Team',
        coachUserId: String(params.p_coach_user_id),
      };
      this.teams.set(teamId, team);

      const invite = {
        id: inviteId,
        teamId,
        normalizedCode,
        state: 'active',
        maxUses: Number.isFinite(params.p_max_uses) ? params.p_max_uses : null,
        useCount: 0,
        expiresAt,
      };
      this.invites.set(inviteId, invite);

      return [{ team_id: teamId, invite_id: inviteId, invite_code: inviteCode, invite_expires_at: expiresAt }];
    }

    if (fnName === 'resolve_team_invite_context') {
      const subject = String(params.p_subject_key || '').trim().toLowerCase();
      if (!subject) throw new Error('SUBJECT_KEY_REQUIRED');

      const invite = this.findInviteByCode(params.p_invite_code);
      if (!invite) throw new Error('INVALID_CODE');
      if (invite.state === 'revoked') throw new Error('REVOKED_CODE');
      if (invite.expiresAt && new Date(invite.expiresAt).getTime() <= this.now()) throw new Error('EXPIRED_CODE');
      if (invite.maxUses != null && invite.useCount >= invite.maxUses) throw new Error('INVITE_MAX_USES_REACHED');

      const token = `ctx-${Math.random().toString(36).slice(2, 12)}`;
      const expiresAt = new Date(this.now() + 15 * 60 * 1000).toISOString();
      this.sessions.set(token, {
        token,
        subject,
        inviteId: invite.id,
        teamId: invite.teamId,
        expiresAt,
        consumed: false,
      });

      return [{ join_context_token: token, invite_id: invite.id, team_id: invite.teamId, expires_at: expiresAt }];
    }

    if (fnName === 'confirm_team_invite_join_from_context') {
      const userId = String(params.p_user_id || '').trim();
      const subject = String(params.p_subject_key || '').trim().toLowerCase();
      const token = String(params.p_join_context_token || '').trim();
      if (!userId) throw new Error('USER_ID_REQUIRED');
      if (!subject) throw new Error('SUBJECT_KEY_REQUIRED');
      if (!token) throw new Error('JOIN_CONTEXT_TOKEN_REQUIRED');

      const session = this.sessions.get(token);
      if (!session || session.subject !== subject) throw new Error('INVALID_OR_EXPIRED_JOIN_CONTEXT');
      if (session.consumed) throw new Error('JOIN_CONTEXT_ALREADY_USED');
      if (new Date(session.expiresAt).getTime() <= this.now()) throw new Error('JOIN_CONTEXT_EXPIRED');

      const invite = this.invites.get(session.inviteId);
      if (!invite) throw new Error('INVALID_CODE');
      if (invite.state === 'revoked') throw new Error('REVOKED_CODE');
      if (invite.expiresAt && new Date(invite.expiresAt).getTime() <= this.now()) throw new Error('EXPIRED_CODE');
      if (invite.maxUses != null && invite.useCount >= invite.maxUses) throw new Error('INVITE_MAX_USES_REACHED');

      const membershipKey = `${session.teamId}::${userId}`;
      const existingMembership = this.memberships.get(membershipKey);
      if (existingMembership) {
        session.consumed = true;
        return [{ membership_id: existingMembership.id, team_id: session.teamId, invite_id: session.inviteId, join_status: 'duplicate_membership' }];
      }

      this.membershipSeq += 1;
      const membershipId = this.randomId('membership', this.membershipSeq);
      const membership = { id: membershipId, teamId: session.teamId, userId };
      this.memberships.set(membershipKey, membership);

      invite.useCount += 1;
      if (invite.maxUses != null && invite.useCount >= invite.maxUses) {
        invite.state = 'consumed';
      }

      session.consumed = true;

      return [{ membership_id: membershipId, team_id: session.teamId, invite_id: session.inviteId, join_status: 'joined' }];
    }

    throw new Error(`Unsupported RPC: ${fnName}`);
  }
}

async function setupCoachWithInvite(engine, { maxUses = null, ttlHours = 24 } = {}) {
  const bootstrap = await bootstrapCoachSignup({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    coachUserId: 'coach@shotlab.app',
    teamName: 'Titans',
    inviteTtlHours: ttlHours,
    maxUses,
  });
  assert.equal(bootstrap.ok, true);
  return bootstrap.data;
}

test('coach signup creates team and invite', async () => {
  const engine = new FakeInviteEngine();
  const data = await setupCoachWithInvite(engine);

  assert.ok(data.team_id);
  assert.ok(data.invite_id);
  assert.ok(data.invite_code);
  assert.equal(engine.teams.size, 1);
  assert.equal(engine.invites.size, 1);
});

test('valid code is accepted', async () => {
  const engine = new FakeInviteEngine();
  const invite = await setupCoachWithInvite(engine);

  const result = await startInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    subjectKey: 'player@shotlab.app',
    inviteCode: invite.invite_code,
  });

  assert.equal(result.ok, true);
  assert.ok(result.data.join_context_token);
});

test('whitespace/casing/hyphen variants validate as the same code', async () => {
  const engine = new FakeInviteEngine();
  const invite = await setupCoachWithInvite(engine);
  const code = invite.invite_code;
  const variant = `  ${code.slice(0, 4).toLowerCase()}-${code.slice(4).toLowerCase()}  `;

  const result = await startInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    subjectKey: 'player@shotlab.app',
    inviteCode: variant,
  });

  assert.equal(result.ok, true);
});

test('invalid code is rejected', async () => {
  const engine = new FakeInviteEngine();
  await setupCoachWithInvite(engine);

  const result = await startInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    subjectKey: 'player@shotlab.app',
    inviteCode: 'NOTREAL',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, 'invalid_code');
});

test('expired code is rejected', async () => {
  const engine = new FakeInviteEngine();
  const invite = await setupCoachWithInvite(engine);
  const inv = [...engine.invites.values()][0];
  inv.expiresAt = new Date(Date.now() - 60_000).toISOString();

  const result = await startInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    subjectKey: 'player@shotlab.app',
    inviteCode: invite.invite_code,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, 'expired_code');
});

test('revoked code is rejected', async () => {
  const engine = new FakeInviteEngine();
  const invite = await setupCoachWithInvite(engine);
  const inv = [...engine.invites.values()][0];
  inv.state = 'revoked';

  const result = await startInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    subjectKey: 'player@shotlab.app',
    inviteCode: invite.invite_code,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, 'revoked_code');
});

test('duplicate membership is blocked', async () => {
  const engine = new FakeInviteEngine();
  const invite = await setupCoachWithInvite(engine);

  const ctx1 = await startInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), subjectKey: 'player@shotlab.app', inviteCode: invite.invite_code });
  const firstJoin = await confirmInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    userId: 'player@shotlab.app',
    subjectKey: 'player@shotlab.app',
    joinContextToken: ctx1.data.join_context_token,
  });
  assert.equal(firstJoin.ok, true);
  assert.equal(firstJoin.data.status, 'joined');

  const ctx2 = await startInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), subjectKey: 'player@shotlab.app', inviteCode: invite.invite_code });
  const secondJoin = await confirmInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    userId: 'player@shotlab.app',
    subjectKey: 'player@shotlab.app',
    joinContextToken: ctx2.data.join_context_token,
  });

  assert.equal(secondJoin.ok, true);
  assert.equal(secondJoin.data.status, 'duplicate_membership');
  assert.equal(engine.memberships.size, 1);
});

test('concurrent attempts do not create duplicate memberships', async () => {
  const engine = new FakeInviteEngine();
  const invite = await setupCoachWithInvite(engine, { maxUses: 10 });

  const [ctxA, ctxB] = await Promise.all([
    startInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), subjectKey: 'player@shotlab.app', inviteCode: invite.invite_code }),
    startInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), subjectKey: 'player@shotlab.app', inviteCode: invite.invite_code }),
  ]);

  const [joinA, joinB] = await Promise.all([
    confirmInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), userId: 'player@shotlab.app', subjectKey: 'player@shotlab.app', joinContextToken: ctxA.data.join_context_token }),
    confirmInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), userId: 'player@shotlab.app', subjectKey: 'player@shotlab.app', joinContextToken: ctxB.data.join_context_token }),
  ]);

  const statuses = [joinA.data.status, joinB.data.status].sort();
  assert.deepEqual(statuses, ['duplicate_membership', 'joined']);
  assert.equal(engine.memberships.size, 1);
});

test('invite use count increments correctly', async () => {
  const engine = new FakeInviteEngine();
  const invite = await setupCoachWithInvite(engine, { maxUses: 2 });

  const ctx1 = await startInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), subjectKey: 'player1@shotlab.app', inviteCode: invite.invite_code });
  const join1 = await confirmInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), userId: 'player1@shotlab.app', subjectKey: 'player1@shotlab.app', joinContextToken: ctx1.data.join_context_token });
  assert.equal(join1.ok, true);

  const inv = [...engine.invites.values()][0];
  assert.equal(inv.useCount, 1);

  const ctx2 = await startInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), subjectKey: 'player2@shotlab.app', inviteCode: invite.invite_code });
  const join2 = await confirmInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), userId: 'player2@shotlab.app', subjectKey: 'player2@shotlab.app', joinContextToken: ctx2.data.join_context_token });
  assert.equal(join2.ok, true);
  assert.equal(inv.useCount, 2);
  assert.equal(inv.state, 'consumed');
});

test('join flow works for newly created player', async () => {
  const engine = new FakeInviteEngine();
  const invite = await setupCoachWithInvite(engine);

  const context = await startInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), subjectKey: 'new.player@shotlab.app', inviteCode: invite.invite_code });
  const join = await confirmInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    userId: 'new.player@shotlab.app',
    subjectKey: 'new.player@shotlab.app',
    joinContextToken: context.data.join_context_token,
  });

  assert.equal(join.ok, true);
  assert.equal(join.data.status, 'joined');
});

test('join flow works for existing authenticated player', async () => {
  const engine = new FakeInviteEngine();
  const invite = await setupCoachWithInvite(engine);

  const context = await startInviteContext({ callRpc: (fn, params) => engine.callRpc(fn, params), subjectKey: 'existing@shotlab.app', inviteCode: invite.invite_code });
  const join = await confirmInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    userId: 'existing@shotlab.app',
    subjectKey: 'existing@shotlab.app',
    joinContextToken: context.data.join_context_token,
  });

  assert.equal(join.ok, true);
  assert.equal(join.data.status, 'joined');
});

test('integration happy path: coach signup -> invite -> validate -> player signup -> membership', async () => {
  const engine = new FakeInviteEngine();

  const coachBootstrap = await bootstrapCoachSignup({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    coachUserId: 'coach@shotlab.app',
    teamName: 'Titans',
    inviteTtlHours: 24,
    maxUses: 5,
  });
  assert.equal(coachBootstrap.ok, true);

  const context = await startInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    subjectKey: 'rookie@shotlab.app',
    inviteCode: coachBootstrap.data.invite_code,
  });
  assert.equal(context.ok, true);
  assert.equal(context.data.lookup_count, 1);
  assert.equal(context.data.matched_team_id, coachBootstrap.data.team_id);

  const playerSignupUserId = 'rookie@shotlab.app';

  const join = await confirmInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    userId: playerSignupUserId,
    subjectKey: 'rookie@shotlab.app',
    joinContextToken: context.data.join_context_token,
    clientRequestId: 'req-1',
  });

  assert.equal(join.ok, true);
  assert.equal(join.data.status, 'joined');
  assert.equal(join.data.team_id, coachBootstrap.data.team_id);
  assert.equal(engine.memberships.size, 1);
});

test('player registration appears on the registering coach roster only', async () => {
  const engine = new FakeInviteEngine();
  const teamA = await setupCoachWithInvite(engine, { maxUses: 5 });
  const teamB = await bootstrapCoachSignup({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    coachUserId: 'coach-b@shotlab.app',
    teamName: 'Warriors',
    inviteTtlHours: 24,
    maxUses: 5,
  });

  const context = await startInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    subjectKey: 'new.player@shotlab.app',
    inviteCode: teamA.invite_code,
  });
  const join = await confirmInviteContext({
    callRpc: (fn, params) => engine.callRpc(fn, params),
    userId: 'new.player@shotlab.app',
    subjectKey: 'new.player@shotlab.app',
    joinContextToken: context.data.join_context_token,
  });

  assert.equal(join.ok, true);
  assert.equal(join.data.status, 'joined');
  assert.deepEqual(engine.getRosterForTeam(teamA.team_id), ['new.player@shotlab.app']);
  assert.deepEqual(engine.getRosterForTeam(teamB.data.team_id), []);
});
