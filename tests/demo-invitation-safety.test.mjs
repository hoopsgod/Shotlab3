import test from "node:test";
import assert from "node:assert/strict";
import { loadCoachPlayerInvitations, provisionCoachPlayer } from "../src/lib/coachPlayerInvitationService.js";

const DEMO_COACH = { email: "coach.demo@shotlab.app", role: "coach" };

test("demo Coach cannot provision or send a real player invitation", async () => {
  let fetchCalls = 0;
  const fetchImpl = async () => {
    fetchCalls += 1;
    throw new Error("network should not be reached");
  };
  const result = await provisionCoachPlayer({
    coach: DEMO_COACH,
    teamId: "team-demo-titans",
    firstName: "Sample",
    lastName: "Player",
    email: "sample@example.com",
    fetchImpl,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "sandbox_action_blocked");
  assert.match(result.error, /demo sandbox/i);
  assert.equal(fetchCalls, 0);
});

test("demo Coach invitation history is sandbox-local and performs no network read", async () => {
  let fetchCalls = 0;
  const fetchImpl = async () => {
    fetchCalls += 1;
    throw new Error("network should not be reached");
  };
  const result = await loadCoachPlayerInvitations({ coach: DEMO_COACH, teamId: "team-demo-titans", fetchImpl });
  assert.deepEqual(result, { ok: true, invitations: [], storageMode: "demo_local" });
  assert.equal(fetchCalls, 0);
});
