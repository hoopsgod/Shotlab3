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

export default function PlayersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL PLAYERS");
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
        activeFilter === "ALL PLAYERS" ||
        (activeFilter === "ACTIVE" && player.active) ||
        (activeFilter === "INACTIVE" && !player.active);
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
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    cursor: "pointer",
    border: isActive ? "none" : "1px solid var(--stroke-1)",
    background: isActive ? "var(--accent)" : "var(--surface-1)",
    color: isActive ? "#0B0D10" : "var(--text-3)",
    fontWeight: isActive ? 700 : 500,
  });

  return (
    <div style={{ background: "var(--bg-0)", minHeight: "100vh", padding: "var(--page-gutter)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
        <Users size={22} color="var(--text-2)" />
        <span
          style={{
            fontSize: "24px",
            fontWeight: 900,
            textTransform: "uppercase",
            color: "var(--text-1)",
            fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
          }}
        >
          PLAYERS
        </span>
      </div>

      <p style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "var(--space-6)" }}>
        Manage your roster and track player engagement
      </p>

      <input
        className="input"
        type="text"
        placeholder="Search players"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          fontSize: "14px",
          marginBottom: "var(--space-2)",
        }}
      />

      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        {["ALL PLAYERS", "ACTIVE", "INACTIVE"].map((filter) => (
          <button key={filter} onClick={() => setActiveFilter(filter)} className={`btn chip ${activeFilter === filter ? "btn--primary" : "btn--tertiary"}`} aria-pressed={activeFilter === filter} style={chipStyle(activeFilter === filter)}>
            {filter}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "var(--surface-2)",
          borderRadius: "16px",
          padding: "var(--space-4)",
          marginBottom: "var(--space-4)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-1)" }}>{totalPlayers}</span>
          <span style={{ fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase", marginTop: "var(--space-2)" }}>Total</span>
        </div>
        <div style={{ width: "1px", background: "var(--stroke-1)", alignSelf: "stretch" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--accent)" }}>{activePlayers}</span>
          <span style={{ fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase", marginTop: "var(--space-2)" }}>Active</span>
        </div>
        <div style={{ width: "1px", background: "var(--stroke-1)", alignSelf: "stretch" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-2)" }}>{inactivePlayers}</span>
          <span style={{ fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase", marginTop: "var(--space-2)" }}>Inactive</span>
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
          <p style={{ fontSize: "18px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-2)", margin: 0 }}>
            NO PLAYERS YET
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-3)", textAlign: "center", maxWidth: "260px", margin: 0 }}>
            Invite players to join your program
          </p>
          <button className="btn btn--primary">
            INVITE PLAYERS
          </button>
        </div>
      ) : (
        filteredPlayers.map((player) => (
          <div
            key={player.id}
            className="interactive-card"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--stroke-1)",
              borderRadius: "16px",
              padding: "var(--space-4)",
              marginBottom: "var(--space-2)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
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
                border: player.active ? "2px solid var(--accent-soft)" : "2px solid var(--stroke-1)",
              }}
            >
              {player.name?.[0] || "?"}
            </div>
            <div style={{ flex: 1, fontSize: "15px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-1)" }}>
              {player.name}
            </div>
            <ChevronRight size={16} color="var(--text-3)" />
          </div>
        ))
      )}

      <p
        style={{
          fontSize: "13px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          color: "var(--text-1)",
          marginTop: "var(--space-6)",
          marginBottom: "var(--space-2)",
        }}
      >
        GROW YOUR ROSTER
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
          gap: "var(--space-2)",
        }}
      >
        <UserPlus size={32} color="var(--text-2)" />
        <p style={{ fontSize: "16px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-2)", margin: 0 }}>
          INVITE A PLAYER
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-3)", textAlign: "center", maxWidth: "260px", margin: 0 }}>
          Share your program link and players can join instantly
        </p>
        <button onClick={shareInviteLink} className="btn btn--primary">
          SHARE INVITE LINK
        </button>
        {copied && <p style={{ fontSize: "12px", color: "var(--text-2)", margin: 0 }}>Link copied</p>}
      </div>
    </div>
  );
}
