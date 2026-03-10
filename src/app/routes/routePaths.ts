export const ROUTE_PATHS = {
  HOME: "/",
  PLAYER: "/player",
  PLAYERS: "/players",
  COACH: "/coach",
  SETTINGS: "/settings",
} as const;

export const FUTURE_ROUTE_PATHS = [
  ROUTE_PATHS.PLAYER,
  ROUTE_PATHS.PLAYERS,
  ROUTE_PATHS.COACH,
  ROUTE_PATHS.SETTINGS,
];
