const lower = (value) => String(value || "").toLowerCase();

export const WORKSPACE_RECOVERY_CODES = Object.freeze({
  ASSET_LOAD_FAILED: "asset_load_failed",
  PERMISSION_DENIED: "permission_denied",
  NETWORK_UNAVAILABLE: "network_unavailable",
  RENDER_REFERENCE_ERROR: "render_reference_error",
  RENDER_TYPE_ERROR: "render_type_error",
  WORKSPACE_FAILED: "workspace_failed",
});

export function classifyWorkspaceError(error) {
  const name = lower(error?.name);
  const message = lower(error?.message || error);

  if (
    message.includes("loading chunk")
    || message.includes("failed to fetch dynamically imported module")
    || message.includes("dynamically imported module")
    || message.includes("importing a module script failed")
  ) return WORKSPACE_RECOVERY_CODES.ASSET_LOAD_FAILED;

  if (
    message.includes("permission denied")
    || message.includes("row-level security")
    || message.includes("rls")
    || message.includes("not authorized")
    || message.includes("unauthorized")
    || message.includes("forbidden")
  ) return WORKSPACE_RECOVERY_CODES.PERMISSION_DENIED;

  if (
    message.includes("networkerror")
    || message.includes("failed to fetch")
    || message.includes("network request failed")
    || message.includes("load failed")
    || message.includes("offline")
  ) return WORKSPACE_RECOVERY_CODES.NETWORK_UNAVAILABLE;

  if (name === "referenceerror") return WORKSPACE_RECOVERY_CODES.RENDER_REFERENCE_ERROR;
  if (name === "typeerror") return WORKSPACE_RECOVERY_CODES.RENDER_TYPE_ERROR;
  return WORKSPACE_RECOVERY_CODES.WORKSPACE_FAILED;
}

export function buildWorkspaceRecoveryModel({ error, label = "workspace" } = {}) {
  const safeLabel = String(label || "workspace").trim();
  const code = classifyWorkspaceError(error);
  const models = {
    [WORKSPACE_RECOVERY_CODES.ASSET_LOAD_FAILED]: {
      title: `Reload ${safeLabel}`,
      detail: "A newer ShotLab screen is available, but this device could not finish loading it.",
      primaryAction: "reload",
      primaryLabel: "Reload workspace",
    },
    [WORKSPACE_RECOVERY_CODES.PERMISSION_DENIED]: {
      title: `${safeLabel} is temporarily unavailable`,
      detail: "ShotLab could not safely access this team data. Your saved records remain protected.",
      primaryAction: "retry",
      primaryLabel: "Try again",
    },
    [WORKSPACE_RECOVERY_CODES.NETWORK_UNAVAILABLE]: {
      title: `${safeLabel} could not connect`,
      detail: "Check the connection and reopen this section. Saved training data on this device is not removed.",
      primaryAction: "retry",
      primaryLabel: "Try again",
    },
    [WORKSPACE_RECOVERY_CODES.RENDER_REFERENCE_ERROR]: {
      title: `Reset ${safeLabel}`,
      detail: "This section hit a temporary display problem. Reopen it here without clearing saved training data.",
      primaryAction: "retry",
      primaryLabel: "Reopen section",
    },
    [WORKSPACE_RECOVERY_CODES.RENDER_TYPE_ERROR]: {
      title: `Reset ${safeLabel}`,
      detail: "This section received incomplete information and stopped before showing an unreliable result.",
      primaryAction: "retry",
      primaryLabel: "Reopen section",
    },
    [WORKSPACE_RECOVERY_CODES.WORKSPACE_FAILED]: {
      title: `${safeLabel} is temporarily unavailable`,
      detail: "ShotLab stopped this section before it could affect the rest of the app.",
      primaryAction: "retry",
      primaryLabel: "Try again",
    },
  };

  return {
    code,
    eyebrow: "Section recovery",
    note: "These recovery actions do not clear training data saved on this device.",
    ...models[code],
  };
}

export function resolveDataDisplayState({ status = "idle", rows = [] } = {}) {
  const safeStatus = lower(status);
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeStatus === "loading" || safeStatus === "pending") return "loading";
  if (safeStatus === "error" || safeStatus === "failed") return "error";
  if (safeStatus === "success" && safeRows.length > 0) return "ready";
  return "empty";
}
