export default function CoachContainer({
  CoachComponent,
  u,
  team,
  teamId,
  playerProfiles,
  ...coachProps
}) {
  return (
    <div className="screen-fade-in">
      <CoachComponent
        u={u}
        team={team}
        playerProfiles={playerProfiles.filter((pp) => pp.teamId === teamId)}
        {...coachProps}
      />
    </div>
  );
}
