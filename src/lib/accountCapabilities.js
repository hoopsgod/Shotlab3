import { isDemoAccount, isDemoPersistenceSession } from "./demoMode.js";

const freeze = (value) => Object.freeze(value);

export const REGISTERED_ACCOUNT_CAPABILITIES = freeze({
  isSandbox: false,
  dataSource: "tenant",
  canPersistRemoteWrites: true,
  canPersistSandboxMutations: false,
  canResetSandbox: false,
  canSendInvites: true,
  canSendNotifications: true,
  canModifyBilling: true,
  canDeleteAccount: true,
  canPerformExternalActions: true,
});

export const SANDBOX_ACCOUNT_CAPABILITIES = freeze({
  isSandbox: true,
  dataSource: "sandbox",
  canPersistRemoteWrites: false,
  canPersistSandboxMutations: true,
  canResetSandbox: true,
  canSendInvites: false,
  canSendNotifications: false,
  canModifyBilling: false,
  canDeleteAccount: false,
  canPerformExternalActions: false,
});

/**
 * Resolve account-level capabilities once at the application boundary.
 * Presentation components receive capabilities; they never need to know what
 * email address, URL flag, or storage marker makes an account a demo account.
 */
export function buildAccountCapabilities(userOrEmail, options = {}) {
  const hasExplicitSandbox = typeof options.isSandbox === "boolean";
  const isSandbox = hasExplicitSandbox
    ? options.isSandbox
    : isDemoAccount(userOrEmail) || isDemoPersistenceSession(options.persistenceOptions || {});

  return isSandbox ? SANDBOX_ACCOUNT_CAPABILITIES : REGISTERED_ACCOUNT_CAPABILITIES;
}

export function capabilityError(capability) {
  const messages = {
    canResetSandbox: "Demo data controls are available only inside the demo sandbox.",
    canSendInvites: "Player invitations are disabled in the demo sandbox.",
    canSendNotifications: "Real notifications are disabled in the demo sandbox.",
    canModifyBilling: "Billing changes are disabled in the demo sandbox.",
    canDeleteAccount: "Account deletion is disabled in the demo sandbox.",
    canPerformExternalActions: "This external action is disabled in the demo sandbox.",
  };
  return messages[capability] || "This action is disabled in the demo sandbox.";
}

export function requireAccountCapability(capabilities, capability) {
  if (capabilities?.[capability] === true) return { ok: true };
  return { ok: false, code: "sandbox_action_blocked", error: capabilityError(capability) };
}
