import { useEffect } from "react";
import { announceFeedback } from "./AppFeedbackLayer.jsx";
import {
  TEAM_STORE_REFERRALS_KEY,
  TEAM_STORE_STORAGE_KEY,
} from "../lib/teamStore.js";

const BRIDGE_KEY = "__shotlabTeamStoreFeedbackBridge";

function feedbackForKey(key) {
  if (key === TEAM_STORE_STORAGE_KEY) {
    return {
      tone: "success",
      title: "Team Store published",
      message: "The verified storefront is now available from ShotLab for players and families.",
    };
  }
  if (key === TEAM_STORE_REFERRALS_KEY) {
    return {
      tone: "info",
      title: "Partner path recorded",
      message: "ShotLab recorded that this device opened the configured SquadLocker partner destination.",
    };
  }
  return null;
}

function announcePersisted(key) {
  const detail = feedbackForKey(key);
  if (detail) announceFeedback(detail);
}

function announceFailure(key, error) {
  if (!feedbackForKey(key)) return;
  announceFeedback({
    tone: "error",
    title: key === TEAM_STORE_STORAGE_KEY ? "Team Store was not saved" : "Partner path was not recorded",
    message: error?.message || "ShotLab could not verify this change. Nothing has been confirmed; try again.",
    duration: 5200,
  });
}

function installBridge() {
  const existing = window[BRIDGE_KEY];
  if (existing) {
    existing.references += 1;
    return existing;
  }

  const storageApi = window.storage;
  const bridge = {
    references: 1,
    storageApi,
    originalSet: null,
    wrappedSet: null,
  };

  if (storageApi && typeof storageApi.set === "function") {
    bridge.originalSet = storageApi.set;
    bridge.wrappedSet = async function wrappedTeamStoreSet(key, value, ...rest) {
      try {
        const result = await bridge.originalSet.call(this, key, value, ...rest);
        announcePersisted(key);
        return result;
      } catch (error) {
        announceFailure(key, error);
        throw error;
      }
    };
    storageApi.set = bridge.wrappedSet;
  }

  window[BRIDGE_KEY] = bridge;
  return bridge;
}

function uninstallBridge(bridge) {
  bridge.references -= 1;
  if (bridge.references > 0) return;

  if (bridge.storageApi?.set === bridge.wrappedSet && bridge.originalSet) {
    bridge.storageApi.set = bridge.originalSet;
  }
  delete window[BRIDGE_KEY];
}

export default function TeamStoreFeedbackBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const bridge = installBridge();
    return () => uninstallBridge(bridge);
  }, []);

  return null;
}
