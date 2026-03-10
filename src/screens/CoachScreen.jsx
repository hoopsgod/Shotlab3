import CoachCommandCenter from "../components/CoachCommandCenter";

const noop = () => {};

export default function CoachScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-1)" }}>
      <CoachCommandCenter
        totalPlayers={12}
        activeTodayCount={7}
        nextEventDateFormatted="Tomorrow"
        highlightPlayersAttention={2}
        primaryQuickAction="addPlayer"
        onPlayersClick={noop}
        onActiveTodayClick={noop}
        onNextEventClick={noop}
        onAddPlayer={noop}
        onAddDrill={noop}
        onScheduleEvent={noop}
        onLogScore={noop}
        joinCode="SHOTLAB"
        onCopyJoinCode={noop}
        onRegenerateJoinCode={noop}
        codeErr={""}
      />
    </div>
  );
}
