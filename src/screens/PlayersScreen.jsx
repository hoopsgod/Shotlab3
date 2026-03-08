import { useMemo, useState } from "react";
import Button from "../components/ui/Button";
import { EmptyStateCard, HeroActionCard, ListItemCard, MediaTutorialCard, MetricCard } from "../components/PremiumCards";

const Users = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 8v6" />
    <path d="M23 11h-6" />
  </svg>
);

const UserPlus = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 8v6" />
    <path d="M23 11h-6" />
  </svg>
);

const ChevronRight = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const StatusBadge = ({ active }) => {
  const tone = active
    ? { label: "✓ Active", color: "var(--color-success)", bg: "rgba(99, 222, 143, 0.16)" }
    : { label: "⏳ Inactive", color: "var(--color-pending)", bg: "rgba(255, 191, 102, 0.18)" };

  return (
    <span className="status-chip" style={{ color: tone.color, background: tone.bg, fontSize: "11px", letterSpacing: "0.04em", textTransform: "none" }}>
      {tone.label}
    </span>
  );
};

export default function PlayersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All players");
  const [copied, setCopied] = useState(false);

  const players = [];
  const totalPlayers = players.length;
  const activePlayers = 0;
  const inactivePlayers = 0;

  const filteredPlayers = useMemo(() => players.filter((player) => {
    const matchesSearch = (player.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All players" || (activeFilter === "Active" && player.active) || (activeFilter === "Inactive" && !player.active);
    return matchesSearch && matchesFilter;
  }), [players, searchQuery, activeFilter]);

  const shareInviteLink = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      await navigator.share({ title: "Join my ShotLab Program", text: "Your coach has invited you to join their basketball training program", url });
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page" style={{ minHeight: "100vh" }}>
      <HeroActionCard style={{ marginBottom: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
          <Users size={22} color="var(--text-2)" />
          <span style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-1)", letterSpacing: "0.04em" }}>Players</span>
        </div>
        <p style={{ fontSize: "var(--fs-helper)", color: "var(--text-2)", marginBottom: "var(--space-3)", lineHeight: "var(--lh-helper)" }}>
          Manage your roster and track player engagement with clearer status visibility.
        </p>
        <input className="input" type="text" placeholder="Search players" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ fontSize: "var(--fs-body)" }} />
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {["All players", "Active", "Inactive"].map((filter) => (
            <Button key={filter} onClick={() => setActiveFilter(filter)} className="chip" variant={activeFilter === filter ? "primary" : "tertiary"} aria-pressed={activeFilter === filter}>
              {filter}
            </Button>
          ))}
        </div>
      </HeroActionCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        {[{ label: "Total", value: totalPlayers, tone: "var(--text-1)" }, { label: "Active", value: activePlayers, tone: "var(--accent)" }, { label: "Inactive", value: inactivePlayers, tone: "var(--text-2)" }].map((stat) => (
          <MetricCard key={stat.label}>
            <span style={{ fontSize: "20px", fontWeight: 900, color: stat.tone }}>{stat.value}</span>
            <span style={{ fontSize: "10px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{stat.label}</span>
          </MetricCard>
        ))}
      </div>

      {players.length === 0 ? (
        <EmptyStateCard className="emptyState" style={{ marginBottom: "var(--space-4)" }}>
          <div className="emptyState__art"><Users size={48} color="var(--text-3)" /></div>
          <p className="emptyState__title">No players yet</p>
          <p className="emptyState__subtitle">Invite players to join your program and begin tracking progress.</p>
          <div className="emptyState__actions"><Button variant="primary">Invite players</Button></div>
        </EmptyStateCard>
      ) : (
        filteredPlayers.map((player) => (
          <ListItemCard
            key={player.id}
            role="button"
            tabIndex={0}
            aria-label={`${player.name} status ${player.active ? "active" : "inactive"}`}
            style={{ marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer" }}
          >
            <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.04)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
              {player.name?.[0] || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: "var(--space-2)" }}>{player.name}</div>
              <StatusBadge active={player.active} />
            </div>
            <ChevronRight size={16} color="var(--text-3)" />
          </ListItemCard>
        ))
      )}

      <MediaTutorialCard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", margin: 0 }}>Roster Growth</p>
            <p style={{ fontSize: 14, color: "var(--text-2)", margin: "var(--space-2) 0 0" }}>Share your program link and players can join instantly.</p>
          </div>
          <UserPlus size={30} color="var(--text-2)" />
        </div>
        <Button onClick={shareInviteLink} variant="secondary">Share invite link</Button>
        {copied && <p style={{ fontSize: "12px", color: "var(--text-2)", margin: 0 }}>Link copied</p>}
      </MediaTutorialCard>
    </div>
  );
}
