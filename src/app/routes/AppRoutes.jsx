import App from "../../App";
import PlayersScreen from "../../screens/PlayersScreen";
import { ROUTE_PATHS } from "./routePaths";

const normalizePathname = (pathname) => {
  if (!pathname || pathname === ROUTE_PATHS.HOME) {
    return ROUTE_PATHS.HOME;
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

export default function AppRoutes() {
  const currentPath = normalizePathname(window.location.pathname);

  if (currentPath === ROUTE_PATHS.PLAYER) {
    return <PlayersScreen />;
  }

  if (currentPath === ROUTE_PATHS.HOME || currentPath === ROUTE_PATHS.COACH || currentPath === ROUTE_PATHS.SETTINGS) {
    return <App />;
  }

  return <App />;
}
