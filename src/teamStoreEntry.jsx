import React from "react";
import ReactDOM from "react-dom/client";
import AppFeedbackLayer from "./components/AppFeedbackLayer.jsx";
import TeamStoreFeedbackBridge from "./components/TeamStoreFeedbackBridge.jsx";
import TeamStorePortal from "./components/TeamStorePortal.jsx";
import "./components/TeamStoreIndustrial.css";

const mount = document.getElementById("team-store-root");
if (mount) {
  ReactDOM.createRoot(mount).render(
    <React.StrictMode>
      <AppFeedbackLayer />
      <TeamStoreFeedbackBridge />
      <TeamStorePortal />
    </React.StrictMode>,
  );
}
