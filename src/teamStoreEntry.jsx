import React from "react";
import ReactDOM from "react-dom/client";
import TeamStorePortal from "./components/TeamStorePortal.jsx";

const mount = document.getElementById("team-store-root");
if (mount) {
  ReactDOM.createRoot(mount).render(
    <React.StrictMode>
      <TeamStorePortal />
    </React.StrictMode>,
  );
}
