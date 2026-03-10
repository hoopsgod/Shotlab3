import App from "../../App";
import CoachScreen from "../../screens/CoachScreen";
import PlayersScreen from "../../screens/PlayersScreen";
import { ROUTE_PATHS } from "./routePaths";

const normalizePathname = (pathname) => {
  if (!pathname || pathname === ROUTE_PATHS.HOME) {
    return ROUTE_PATHS.HOME;
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

const PLAYER_PATHS = new Set([ROUTE_PATHS.PLAYER, ROUTE_PATHS.PLAYERS]);

export default function AppRoutes() {
  const currentPath = normalizePathname(window.location.pathname);

  if (PLAYER_PATHS.has(currentPath)) {
    return <PlayersScreen />;
  }

  if (currentPath === ROUTE_PATHS.COACH) {
    return <CoachScreen />;
  }

  return <App />;
}
