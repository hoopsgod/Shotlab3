export const PLAYER_FILTERS = ["All players", "Active", "Inactive"];

export function getFilteredPlayers(players, searchQuery, activeFilter) {
  const normalizedQuery = searchQuery.toLowerCase();

  return players.filter((player) => {
    const matchesSearch = (player.name || "").toLowerCase().includes(normalizedQuery);
    const matchesFilter =
      activeFilter === "All players" ||
      (activeFilter === "Active" && player.active) ||
      (activeFilter === "Inactive" && !player.active);

    return matchesSearch && matchesFilter;
  });
}

export function getStatusTone(active) {
  if (active) {
    return {
      label: "Active",
      color: "var(--color-success)",
      border: "rgba(99, 222, 143, 0.42)",
      bg: "rgba(99, 222, 143, 0.16)",
    };
  }

  return {
    label: "Inactive",
    color: "var(--color-pending)",
    border: "rgba(255, 191, 102, 0.42)",
    bg: "rgba(255, 191, 102, 0.18)",
  };
}
