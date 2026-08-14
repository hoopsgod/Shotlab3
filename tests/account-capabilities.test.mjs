import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAccountCapabilities,
  requireAccountCapability,
  REGISTERED_ACCOUNT_CAPABILITIES,
  SANDBOX_ACCOUNT_CAPABILITIES,
} from "../src/lib/accountCapabilities.js";

test("demo Coach and Player identities resolve to the same sandbox capability policy", () => {
  for (const email of ["coach.demo@shotlab.app", "demo@shotlab.app"]) {
    const capabilities = buildAccountCapabilities({ email }, { isSandbox: true });
    assert.deepEqual(capabilities, SANDBOX_ACCOUNT_CAPABILITIES);
    assert.equal(capabilities.isSandbox, true);
    assert.equal(capabilities.dataSource, "sandbox");
    assert.equal(capabilities.canPersistRemoteWrites, false);
    assert.equal(capabilities.canPersistSandboxMutations, true);
    assert.equal(capabilities.canResetSandbox, true);
    assert.equal(capabilities.canSendInvites, false);
    assert.equal(capabilities.canSendNotifications, false);
    assert.equal(capabilities.canModifyBilling, false);
    assert.equal(capabilities.canDeleteAccount, false);
    assert.equal(capabilities.canPerformExternalActions, false);
  }
});

test("registered accounts retain normal production capabilities without demo reset authority", () => {
  const capabilities = buildAccountCapabilities(
    { email: "registered.coach@shotlab.test" },
    { isSandbox: false },
  );
  assert.deepEqual(capabilities, REGISTERED_ACCOUNT_CAPABILITIES);
  assert.equal(capabilities.isSandbox, false);
  assert.equal(capabilities.dataSource, "tenant");
  assert.equal(capabilities.canPersistRemoteWrites, true);
  assert.equal(capabilities.canResetSandbox, false);
  assert.equal(capabilities.canSendInvites, true);
  assert.equal(capabilities.canDeleteAccount, true);
  const resetAttempt = requireAccountCapability(capabilities, "canResetSandbox");
  assert.equal(resetAttempt.ok, false);
  assert.equal(resetAttempt.code, "sandbox_action_blocked");
  assert.match(resetAttempt.error, /only inside the demo sandbox/i);
});

test("capability guard rejects destructive and external demo actions", () => {
  for (const capability of ["canSendInvites", "canSendNotifications", "canModifyBilling", "canDeleteAccount", "canPerformExternalActions"]) {
    const result = requireAccountCapability(SANDBOX_ACCOUNT_CAPABILITIES, capability);
    assert.equal(result.ok, false);
    assert.equal(result.code, "sandbox_action_blocked");
    assert.match(result.error, /demo sandbox/i);
  }
  assert.deepEqual(requireAccountCapability(SANDBOX_ACCOUNT_CAPABILITIES, "canResetSandbox"), { ok: true });
  assert.deepEqual(requireAccountCapability(REGISTERED_ACCOUNT_CAPABILITIES, "canDeleteAccount"), { ok: true });
});
