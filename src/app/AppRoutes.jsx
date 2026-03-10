import CoachContainer from "../features/coach/components/CoachContainer";

export default function AppRoutes({
  AuthComponent,
  CreateTeamComponent,
  JoinTeamComponent,
  PlayerComponent,
  CoachComponent,
  authProps,
  createTeamProps,
  joinTeamProps,
  playerProps,
  coachProps,
}) {
  return {
    auth: (
      <div className="screen-fade-in">
        <AuthComponent {...authProps} />
      </div>
    ),
    "create-team": (
      <div className="screen-fade-in">
        <CreateTeamComponent {...createTeamProps} />
      </div>
    ),
    "join-team": (
      <div className="screen-fade-in">
        <JoinTeamComponent {...joinTeamProps} />
      </div>
    ),
    player: (
      <div className="screen-fade-in">
        <PlayerComponent {...playerProps} />
      </div>
    ),
    coach: <CoachContainer CoachComponent={CoachComponent} {...coachProps} />,
  };
}
