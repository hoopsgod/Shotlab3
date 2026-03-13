import { useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";

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
    borderRadius: "20px",
    height: "32px",
    padding: "0 14px",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    cursor: "pointer",
    border: isActive ? "none" : "1px solid var(--stroke-1)",
    background: isActive ? "var(--accent)" : "var(--surface-1)",
    color: isActive ? "#0B0D10" : "var(--text-3)",
    fontWeight: isActive ? 700 : 500,
  });

  return (
    <div style={{ background: "var(--bg-0)", minHeight: "100vh", padding: "16px" }}>
      <AppHeader
        title="PLAYERS"
        subtitle="Manage your roster and track player engagement"
        leading={<Users size={22} color="var(--text-2)" />}
      />

      <input
        type="text"
        placeholder="Search players"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--stroke-1)",
          borderRadius: "12px",
          height: "44px",
          padding: "0 16px",
          fontSize: "14px",
          color: "var(--text-1)",
          width: "100%",
          boxSizing: "border-box",
          marginBottom: "12px",
        }}
      />

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["ALL PLAYERS", "ACTIVE", "INACTIVE"].map((filter) => (
          <button key={filter} onClick={() => setActiveFilter(filter)} style={chipStyle(activeFilter === filter)}>
            {filter}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "var(--surface-2)",
          borderRadius: "12px",
          padding: "12px 16px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-1)" }}>{totalPlayers}</span>
          <span style={{ fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase", marginTop: "4px" }}>Total</span>
        </div>
        <div style={{ width: "1px", background: "var(--stroke-1)", alignSelf: "stretch" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--accent)" }}>{activePlayers}</span>
          <span style={{ fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase", marginTop: "4px" }}>Active</span>
        </div>
        <div style={{ width: "1px", background: "var(--stroke-1)", alignSelf: "stretch" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-2)" }}>{inactivePlayers}</span>
          <span style={{ fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase", marginTop: "4px" }}>Inactive</span>
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
            gap: "16px",
          }}
        >
          <Users size={48} color="#555555" />
          <p style={{ fontSize: "18px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-2)", margin: 0 }}>
            NO PLAYERS YET
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-3)", textAlign: "center", maxWidth: "260px", margin: 0 }}>
            Invite players to join your program
          </p>
          <button
            style={{
              background: "var(--accent)",
              color: "#000000",
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              height: "52px",
              borderRadius: "14px",
              padding: "0 24px",
              border: "none",
              cursor: "pointer",
            }}
          >
            INVITE PLAYERS
          </button>
        </div>
      ) : (
        filteredPlayers.map((player) => (
          <div
            key={player.id}
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--stroke-1)",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
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
          marginTop: "24px",
          marginBottom: "12px",
        }}
      >
        GROW YOUR ROSTER
      </p>
      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--stroke-1)",
          borderRadius: "16px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <UserPlus size={32} color="var(--text-2)" />
        <p style={{ fontSize: "16px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-2)", margin: 0 }}>
          INVITE A PLAYER
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-3)", textAlign: "center", maxWidth: "260px", margin: 0 }}>
          Share your program link and players can join instantly
        </p>
        <button
          onClick={shareInviteLink}
          style={{
            background: "var(--accent)",
            color: "#000000",
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase",
            height: "52px",
            borderRadius: "14px",
            padding: "0 24px",
            border: "none",
            cursor: "pointer",
          }}
        >
          SHARE INVITE LINK
        </button>
        {copied && <p style={{ fontSize: "12px", color: "var(--text-2)", margin: 0 }}>Link copied</p>}
      </div>
    </div>
  );
}
