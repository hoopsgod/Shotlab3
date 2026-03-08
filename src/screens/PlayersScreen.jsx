import { useMemo, useState } from "react";
import Button from "../components/ui/Button";
import { EmptyStateCard, HeroCard, ListItemCard, MetricCard } from "../components/cards/MobileCards";

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
    ? {
        label: "✓ Active",
        color: "var(--color-success)",
        border: "rgba(99, 222, 143, 0.42)",
        bg: "rgba(99, 222, 143, 0.16)",
      }
    : {
        label: "⏳ Inactive",
        color: "var(--color-pending)",
        border: "rgba(255, 191, 102, 0.42)",
        bg: "rgba(255, 191, 102, 0.18)",
      };

  return (
    <span
      className="status-chip"
      style={{
        color: tone.color,
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        fontSize: "11px",
        letterSpacing: "0.04em",
        textTransform: "none",
      }}
    >
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

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch = (player.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter =
        activeFilter === "All players" ||
        (activeFilter === "Active" && player.active) ||
        (activeFilter === "Inactive" && !player.active);
      return matchesSearch && matchesFilter;
    });
  }, [players, searchQuery, activeFilter]);

  const shareInviteLink = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      await navigator.share({
        title: "Join my ShotLab Program",
        text: "Your coach has invited you to join their basketball training program",
        url,
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const chipStyle = (isActive) => ({
    borderRadius: "var(--btn-radius)",
    height: "var(--btn-h-sm)",
    padding: "0 var(--btn-pad-sm)",
    fontSize: "11px",
    textTransform: "none",
    letterSpacing: "0.08em",
    cursor: "pointer",
    border: isActive ? "1px solid rgba(91, 243, 255, 0.34)" : "1px solid var(--stroke-1)",
    background: isActive ? "rgba(91, 243, 255, 0.18)" : "var(--surface-1)",
    color: isActive ? "var(--text-1)" : "var(--text-3)",
    fontWeight: isActive ? 700 : 500,
  });

  return (
    <div style={{ background: "var(--bg-0)", minHeight: "100vh", padding: "var(--page-gutter)",
      paddingBottom: "calc(var(--nav-height, 74px) + var(--space-8) + env(safe-area-inset-bottom))" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
        <Users size={22} color="var(--text-2)" />
        <span
          style={{
            fontSize: "24px",
            fontWeight: 900,
            textTransform: "uppercase",
            color: "var(--text-1)",
            letterSpacing: "0.04em",
          }}
        >
          Players
        </span>
      </div>

      <p style={{ fontSize: "var(--fs-helper)", color: "var(--text-2)", marginBottom: "var(--space-4)", lineHeight: "var(--lh-helper)" }}>
        Manage your roster and track player engagement with clearer status visibility
      </p>

      <input
        className="input"
        type="text"
        placeholder="Search players"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          fontSize: "var(--fs-body)",
          marginBottom: "var(--space-3)",
        }}
      />

      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        {["All players", "Active", "Inactive"].map((filter) => (
          <Button key={filter} onClick={() => setActiveFilter(filter)} className="chip" variant={activeFilter === filter ? "primary" : "tertiary"} aria-pressed={activeFilter === filter} style={chipStyle(activeFilter === filter)}>
            {filter}
          </Button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        <MetricCard title="Total" value={totalPlayers} style={{ alignItems: "center", textAlign: "center" }} />
        <MetricCard title="Active" value={activePlayers} style={{ alignItems: "center", textAlign: "center" }} />
        <MetricCard title="Inactive" value={inactivePlayers} style={{ alignItems: "center", textAlign: "center" }} />
      </div>

      {players.length === 0 ? (
        <EmptyStateCard
          style={{ minHeight: "280px", justifyContent: "center", marginBottom: "var(--space-3)" }}
          icon={<Users size={48} color="#555555" />}
          title="No players yet"
          description="Invite players to join your program and begin tracking progress"
          actions={<Button variant="primary" aria-label="Invite players to roster">Invite players</Button>}
        />
      ) : (
        filteredPlayers.map((player) => (
          <ListItemCard
            key={player.id}
            as="div"
            className="interactive-card"
            role="button"
            tabIndex={0}
            aria-label={`${player.name} status ${player.active ? "active" : "inactive"}`}
            variant="primary"
            style={{ marginBottom: "var(--space-3)", cursor: "pointer" }}
            leading={(
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "var(--surface-1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text-1)",
                  border: player.active ? "2px solid rgba(91, 243, 255, 0.44)" : "2px solid rgba(167, 187, 211, 0.36)",
                }}
              >
                {player.name?.[0] || "?"}
              </div>
            )}
            title={player.name}
            subtitle={<StatusBadge active={player.active} />}
            trailing={<ChevronRight size={16} color="var(--text-3)" />}
          />
        ))
      )}

      <p
        style={{
          fontSize: "12px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-2)",
          marginTop: "var(--space-8)",
          marginBottom: "var(--space-3)",
        }}
      >
        Roster growth
      </p>
      <HeroCard
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <UserPlus size={32} color="var(--text-2)" />
        <p style={{ fontSize: "16px", fontWeight: 700, textTransform: "none", color: "var(--text-2)", margin: 0 }}>
          Invite a player
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-3)", textAlign: "center", maxWidth: "260px", margin: 0 }}>
          Share your program link and players can join instantly
        </p>
        <Button onClick={shareInviteLink} variant="secondary">
          Share invite link
        </Button>
        {copied && <p style={{ fontSize: "12px", color: "var(--text-2)", margin: 0 }}>Link copied</p>}
      </HeroCard>
    </div>
  );
}
