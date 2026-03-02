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
    borderRadius: "20px",
    height: "32px",
    padding: "0 14px",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    cursor: "pointer",
    border: isActive ? "none" : "1px solid #333333",
    background: isActive ? "#C8FF00" : "#1E1E1E",
    color: isActive ? "#000000" : "#555555",
    fontWeight: isActive ? 700 : 500,
  });

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <Users size={22} color="#C8FF00" />
        <span
          style={{
            fontSize: "24px",
            fontWeight: 900,
            textTransform: "uppercase",
            color: "#C8FF00",
            fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
          }}
        >
          PLAYERS
        </span>
      </div>

      <p style={{ fontSize: "13px", color: "#A0A0A0", marginBottom: "20px" }}>
        Manage your roster and track player engagement
      </p>

      <input
        type="text"
        placeholder="Search players"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          background: "#141414",
          border: "1px solid #333333",
          borderRadius: "12px",
          height: "44px",
          padding: "0 16px",
          fontSize: "14px",
          color: "#FFFFFF",
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
          background: "#141414",
          borderRadius: "12px",
          padding: "12px 16px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "#FFFFFF" }}>{totalPlayers}</span>
          <span style={{ fontSize: "9px", color: "#A0A0A0", textTransform: "uppercase", marginTop: "4px" }}>Total</span>
        </div>
        <div style={{ width: "1px", background: "#242424", alignSelf: "stretch" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "#C8FF00" }}>{activePlayers}</span>
          <span style={{ fontSize: "9px", color: "#A0A0A0", textTransform: "uppercase", marginTop: "4px" }}>Active</span>
        </div>
        <div style={{ width: "1px", background: "#242424", alignSelf: "stretch" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "#555555" }}>{inactivePlayers}</span>
          <span style={{ fontSize: "9px", color: "#A0A0A0", textTransform: "uppercase", marginTop: "4px" }}>Inactive</span>
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
          <p style={{ fontSize: "18px", fontWeight: 700, textTransform: "uppercase", color: "#FFFFFF", margin: 0 }}>
            NO PLAYERS YET
          </p>
          <p style={{ fontSize: "13px", color: "#A0A0A0", textAlign: "center", maxWidth: "260px", margin: 0 }}>
            Invite players to join your program
          </p>
          <button
            style={{
              background: "#C8FF00",
              color: "#000000",
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              height: "52px",
              borderRadius: "14px",
              padding: "0 24px",
              boxShadow: "0 4px 24px rgba(200, 255, 0, 0.25)",
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
              background: "#141414",
              border: "1px solid #242424",
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
                background: "#1E1E1E",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 700,
                color: "#FFFFFF",
                border: player.active ? "2px solid #C8FF00" : "2px solid #333333",
              }}
            >
              {player.name?.[0] || "?"}
            </div>
            <div style={{ flex: 1, fontSize: "15px", fontWeight: 700, textTransform: "uppercase", color: "#FFFFFF" }}>
              {player.name}
            </div>
            <ChevronRight size={16} color="#C8FF00" />
          </div>
        ))
      )}

      <p
        style={{
          fontSize: "13px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          color: "#C8FF00",
          marginTop: "24px",
          marginBottom: "12px",
        }}
      >
        GROW YOUR ROSTER
      </p>
      <div
        style={{
          background: "#141414",
          border: "1px solid #242424",
          borderRadius: "16px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <UserPlus size={32} color="#C8FF00" />
        <p style={{ fontSize: "16px", fontWeight: 700, textTransform: "uppercase", color: "#FFFFFF", margin: 0 }}>
          INVITE A PLAYER
        </p>
        <p style={{ fontSize: "13px", color: "#A0A0A0", textAlign: "center", maxWidth: "260px", margin: 0 }}>
          Share your program link and players can join instantly
        </p>
        <button
          onClick={shareInviteLink}
          style={{
            background: "#C8FF00",
            color: "#000000",
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase",
            height: "52px",
            borderRadius: "14px",
            padding: "0 24px",
            boxShadow: "0 4px 24px rgba(200, 255, 0, 0.25)",
            border: "none",
            cursor: "pointer",
          }}
        >
          SHARE INVITE LINK
        </button>
        {copied && <p style={{ fontSize: "12px", color: "#C8FF00", margin: 0 }}>Link copied</p>}
      </div>
    </div>
  );
}
