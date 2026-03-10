export function getRosterSummary(players) {
  const totalPlayers = players.length;
  const activePlayers = players.filter((player) => player.active).length;

  return {
    totalPlayers,
    activePlayers,
    inactivePlayers: totalPlayers - activePlayers,
  };
}

export function getFilterButtonStyles(activeFilter, filter) {
  const isActive = activeFilter === filter;

  return {
    borderRadius: 999,
    height: 32,
    padding: "0 12px",
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    border: isActive ? "1px solid rgba(91, 243, 255, 0.34)" : "1px solid var(--stroke-1)",
    background: isActive ? "rgba(91, 243, 255, 0.18)" : "var(--surface-1)",
    color: isActive ? "var(--text-1)" : "var(--text-3)",
    fontWeight: 700,
    cursor: "pointer",
  };
}
