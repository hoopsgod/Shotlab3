import App from "../../App";
import { FUTURE_ROUTE_PATHS, ROUTE_PATHS } from "./routePaths";

const normalizePathname = (pathname) => {
  if (!pathname || pathname === ROUTE_PATHS.HOME) {
    return ROUTE_PATHS.HOME;
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

export default function AppRoutes() {
  const currentPath = normalizePathname(window.location.pathname);

  // Routing foundation pass: keep existing app behavior while making
  // a single route entry point explicit for future router adoption.
  if (currentPath === ROUTE_PATHS.HOME || FUTURE_ROUTE_PATHS.includes(currentPath)) {
    return <App />;
  }

  return <App />;
}
