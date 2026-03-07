import { useMemo, useState } from "react";

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
          <button key={filter} onClick={() => setActiveFilter(filter)} className={`btn chip ${activeFilter === filter ? "btn--primary" : "btn--tertiary"}`} aria-pressed={activeFilter === filter} style={chipStyle(activeFilter === filter)}>
            {filter}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--stroke-1)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4)",
          marginBottom: "var(--space-4)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-1)" }}>{totalPlayers}</span>
          <span style={{ fontSize: "10px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "var(--space-2)", fontWeight: 700 }}>Total</span>
        </div>
        <div style={{ width: "1px", background: "var(--stroke-1)", alignSelf: "stretch" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--accent)" }}>{activePlayers}</span>
          <span style={{ fontSize: "10px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "var(--space-2)", fontWeight: 700 }}>Active</span>
        </div>
        <div style={{ width: "1px", background: "var(--stroke-1)", alignSelf: "stretch" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-2)" }}>{inactivePlayers}</span>
          <span style={{ fontSize: "10px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "var(--space-2)", fontWeight: 700 }}>Inactive</span>
        </div>
      </div>

      {players.length === 0 ? (
        <div
          style={{
            minHeight: "280px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-4)",
          }}
        >
          <Users size={48} color="#555555" />
          <p style={{ fontSize: "18px", fontWeight: 700, textTransform: "none", color: "var(--text-2)", margin: 0 }}>
            No players yet
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-3)", textAlign: "center", maxWidth: "260px", margin: 0 }}>
            Invite players to join your program and begin tracking progress
          </p>
          <button className="btn btn--primary" aria-label="Invite players to roster">
            Invite players
          </button>
        </div>
      ) : (
        filteredPlayers.map((player) => (
          <div
            key={player.id}
            className="interactive-card"
            role="button"
            tabIndex={0}
            aria-label={`${player.name} status ${player.active ? "active" : "inactive"}`}
            style={{
              background: "var(--surface-2)",
              border: "1px solid rgba(167, 187, 211, 0.34)",
              borderRadius: "16px",
              padding: "var(--space-4)",
              marginBottom: "var(--space-3)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              cursor: "pointer",
            }}
          >
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "15px", fontWeight: 700, textTransform: "none", color: "var(--text-1)", marginBottom: "var(--space-2)" }}>
                {player.name}
              </div>
              <StatusBadge active={player.active} />
            </div>
            <ChevronRight size={16} color="var(--text-3)" />
          </div>
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
      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--stroke-1)",
          borderRadius: "16px",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <UserPlus size={32} color="var(--text-2)" />
        <p style={{ fontSize: "16px", fontWeight: 700, textTransform: "none", color: "var(--text-2)", margin: 0 }}>
          Invite a player
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-3)", textAlign: "center", maxWidth: "260px", margin: 0 }}>
          Share your program link and players can join instantly
        </p>
        <button onClick={shareInviteLink} className="btn btn--primary">
          Share invite link
        </button>
        {copied && <p style={{ fontSize: "12px", color: "var(--text-2)", margin: 0 }}>Link copied</p>}
      </div>
    </div>
  );
}
