export function getActionVariant(isPrimary) {
  return isPrimary ? "primary" : "tertiary";
}

export function getPlayersMetricSummary(highlightPlayersAttention) {
  return {
    border: highlightPlayersAttention ? "1px solid rgba(255,69,69,0.45)" : "1px solid var(--stroke-1)",
    statusLabel: highlightPlayersAttention ? "Needs check-ins" : "On track",
  };
}
